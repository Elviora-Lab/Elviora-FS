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

    // One statement for every line item (vs. an update per variant) — restores
    // are usually inside a wider transaction, so keep the lock window short.
    await db.$executeRaw`
      UPDATE "product_variants" pv
      SET "stock_quantity" = pv."stock_quantity" + oi.qty
      FROM (
        SELECT "variant_id", SUM("quantity")::int AS qty
        FROM "order_items"
        WHERE "order_id" = ${orderId}::uuid AND "variant_id" IS NOT NULL
        GROUP BY "variant_id"
      ) oi
      WHERE pv."id" = oi."variant_id"`;
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
  outerTx?: Prisma.TransactionClient,
): Promise<{ changed: boolean }> {
  const run = async (tx: Prisma.TransactionClient) => {
    // Status guard lives in the UPDATE's WHERE, so two concurrent calls with
    // the same target status can't both "win" — the loser matches 0 rows and
    // no duplicate history/events are produced.
    const claimed = await tx.order.updateMany({
      where: { id: orderId, orderStatus: { not: status } },
      data: { orderStatus: status },
    });
    if (claimed.count === 0) {
      const exists = await tx.order.findUnique({ where: { id: orderId }, select: { id: true } });
      if (!exists) throw new Error('Order not found');
      return { changed: false };
    }

    await tx.orderStatusHistory.create({ data: { orderId, status, note, changedBy } });

    // Stock restore rides the same transaction — a rollback undoes both the
    // status flip and the restock, never one without the other.
    if (RESTOCK_STATUSES.includes(status)) {
      await restoreOrderStockOnce(orderId, tx);
    }

    return { changed: true };
  };

  const result = outerTx ? await run(outerTx) : await prisma.$transaction(run);

  // Emit only after the transaction commits — a rollback must not send emails.
  // With an outer tx the caller commits later; these events are best-effort
  // side effects (email/notification), acceptable on that margin.
  if (result.changed) {
    if (status === 'SHIPPED') events.emit('order.shipped', { orderId });
    if (status === 'DELIVERED') events.emit('order.delivered', { orderId });
    if (status === 'CANCELLED') events.emit('order.cancelled', { orderId });
  }

  return result;
}
