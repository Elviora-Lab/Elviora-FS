import 'server-only';

import { type OrderStatus, type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

import { events } from '@/server/events';

/** Terminal states after which the order's reserved stock goes back on shelf. */
const RESTOCK_STATUSES: OrderStatus[] = ['CANCELLED', 'RETURNED', 'REFUNDED'];

/**
 * Re-increment variant stock for every line on an order — exactly once.
 *
 * Checkout decrements stock when the order is placed, so any path that takes
 * the order out of fulfilment (admin cancel, return refund, Stripe refund
 * webhook) must give it back. The `stockRestoredAt` claim makes the operation
 * idempotent across those concurrent paths: the conditional `updateMany` lets
 * only ONE caller win, everyone else no-ops.
 */
export async function restoreOrderStockOnce(
  orderId: string,
  tx?: Prisma.TransactionClient,
): Promise<boolean> {
  const run = async (db: Prisma.TransactionClient) => {
    const claimed = await db.order.updateMany({
      where: { id: orderId, stockRestoredAt: null },
      data: { stockRestoredAt: new Date() },
    });
    if (claimed.count === 0) return false;

    const items = await db.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    });
    for (const item of items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }
    return true;
  };

  return tx ? run(tx) : prisma.$transaction(run);
}

/**
 * Move an order to a new status with all the operational side effects the
 * status implies: history row, stock restoration on cancel/return/refund,
 * and customer-facing events (shipped/delivered/cancelled → email +
 * notification via the listeners).
 *
 * All admin-facing transitions (single, bulk, courier booking) go through
 * here so the side effects can't be skipped. Setting the same status again
 * is a no-op — no duplicate history rows or emails.
 */
export async function transitionOrder(
  orderId: string,
  status: OrderStatus,
  note?: string,
  changedBy?: string,
): Promise<{ changed: boolean }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderStatus: true },
  });
  if (!order) throw new Error('Order not found');
  if (order.orderStatus === status) return { changed: false };

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { orderStatus: status } }),
    prisma.orderStatusHistory.create({ data: { orderId, status, note, changedBy } }),
  ]);

  if (RESTOCK_STATUSES.includes(status)) {
    await restoreOrderStockOnce(orderId);
  }

  if (status === 'SHIPPED') events.emit('order.shipped', { orderId });
  if (status === 'DELIVERED') events.emit('order.delivered', { orderId });
  if (status === 'CANCELLED') events.emit('order.cancelled', { orderId });

  return { changed: true };
}
