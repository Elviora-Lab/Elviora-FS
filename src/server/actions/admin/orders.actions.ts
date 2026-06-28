'use server';

import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { ordersRepo } from '@/server/repositories/orders.repo';
import { createPostExOrder, trackPostExOrder } from '@/server/shipping/postex';

const statusValues = Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]];

const updateStatusBody = z.object({
  orderId: z.string().uuid(),
  status: z.enum(statusValues),
  note: z.string().max(500).optional(),
});

export const updateOrderStatus = withAction(async (input: z.infer<typeof updateStatusBody>) => {
  const session = await requireAdmin();
  const { orderId, status, note } = updateStatusBody.parse(input);
  await ordersRepo.setStatus(orderId, status, note, session.sub);
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { orderId, status };
});

const bulkBody = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(200),
  status: z.enum(statusValues),
  note: z.string().max(500).optional(),
});

/**
 * Apply the same status transition to many orders at once. Runs each
 * `setStatus` (order update + statusHistory insert) serially so each one
 * gets its own audit row with the correct actor.
 */
export const bulkUpdateOrderStatus = withAction(async (input: z.infer<typeof bulkBody>) => {
  const session = await requireAdmin();
  const { orderIds, status, note } = bulkBody.parse(input);

  let updated = 0;
  for (const orderId of orderIds) {
    try {
      await ordersRepo.setStatus(orderId, status, note, session.sub);
      updated += 1;
    } catch {
      // Skip individual failures (e.g. order deleted between selection
      // and submit) so one bad row doesn't abort the rest of the batch.
    }
  }

  revalidatePath('/admin/orders');
  return { updated, requested: orderIds.length, status };
});

// ---------------------------------------------------------------------------
// Courier — PostEx
// ---------------------------------------------------------------------------

/** Book an order with PostEx, store the tracking number, and mark it shipped. */
export const bookWithPostEx = withAction(async (input: { orderId: string }) => {
  const session = await requireAdmin();
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true, shipments: true },
  });
  if (!order) throw new NotFoundError('Order not found');
  if (order.shipments.some((s) => s.trackingNumber)) {
    throw new BadRequestError('This order is already booked with a courier');
  }
  if (
    !order.shippingCity ||
    !order.shippingFullName ||
    !order.shippingPhone ||
    !order.shippingAddressLine1
  ) {
    throw new BadRequestError('Order is missing a complete shipping address');
  }

  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const cod = order.paymentStatus === 'PAID' ? 0 : Number(order.totalAmount);
  const deliveryAddress = [
    order.shippingAddressLine1,
    order.shippingAddressLine2,
    order.shippingArea,
  ]
    .filter(Boolean)
    .join(', ');

  const { trackingNumber } = await createPostExOrder({
    cityName: order.shippingCity,
    customerName: order.shippingFullName,
    customerPhone: order.shippingPhone,
    deliveryAddress,
    invoicePayment: cod,
    items: itemCount,
    orderRefNumber: order.orderNumber,
    orderDetail: order.items
      .map((i) => `${i.quantity}x ${i.productName}`)
      .join(', ')
      .slice(0, 500),
  });

  await prisma.shipment.create({
    data: {
      orderId: order.id,
      courierName: 'PostEx',
      trackingNumber,
      shipmentStatus: 'LABEL_CREATED',
      shippedAt: new Date(),
    },
  });
  await ordersRepo.setStatus(
    order.id,
    'SHIPPED',
    `Booked with PostEx (${trackingNumber})`,
    session.sub,
  );

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${order.id}`);
  return { trackingNumber };
});

/** Pull the latest PostEx status for a tracking number (best-effort). */
export const refreshPostExTracking = withAction(async (input: { trackingNumber: string }) => {
  await requireAdmin();
  const { status } = await trackPostExOrder(input.trackingNumber);
  return { status };
});
