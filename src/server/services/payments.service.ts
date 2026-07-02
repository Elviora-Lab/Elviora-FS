import 'server-only';

import { prisma } from '@/lib/db';

import { restoreOrderStockOnce } from './order-transitions.service';

/**
 * Payment-state transitions driven by the Stripe webhook. Every method is
 * IDEMPOTENT: it inspects current state and no-ops if the target state is
 * already reached, so Stripe redelivering the same event has no extra effect.
 * `transitioned` tells the caller whether a real state change happened, so
 * non-critical side effects (notifications) fire only once.
 */
export const paymentsService = {
  async markOrderPaid(orderId: string, transactionId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { paymentStatus: true },
      });
      if (!order || order.paymentStatus === 'PAID') return { transitioned: false };

      await tx.payment.updateMany({
        where: { orderId, paymentStatus: { not: 'PAID' } },
        data: { paymentStatus: 'PAID', paidAt: new Date(), transactionId },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          statusHistory: { create: { status: 'CONFIRMED', note: 'Payment confirmed (Stripe)' } },
        },
      });
      return { transitioned: true };
    });
  },

  async markPaymentFailed(orderId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { paymentStatus: true },
      });
      // Don't touch already-paid orders, and don't restore stock here — a failed
      // attempt may be retried. Stock is restored when an operator cancels.
      if (!order || order.paymentStatus === 'PAID' || order.paymentStatus === 'FAILED') {
        return { transitioned: false };
      }
      await tx.payment.updateMany({
        where: { orderId, paymentStatus: 'PENDING' },
        data: { paymentStatus: 'FAILED' },
      });
      await tx.order.update({ where: { id: orderId }, data: { paymentStatus: 'FAILED' } });
      return { transitioned: true };
    });
  },

  async markOrderRefundedByTransaction(transactionId: string) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { transactionId },
        select: { orderId: true },
      });
      if (!payment) return { transitioned: false };

      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        select: { paymentStatus: true },
      });
      if (!order || order.paymentStatus === 'REFUNDED') return { transitioned: false };

      await tx.payment.updateMany({
        where: { orderId: payment.orderId },
        data: { paymentStatus: 'REFUNDED' },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'REFUNDED',
          orderStatus: 'REFUNDED',
          statusHistory: { create: { status: 'REFUNDED', note: 'Refund processed (Stripe)' } },
        },
      });
      // Idempotent claim — the admin cancel/return paths restock through the
      // same gate, so a webhook redelivery or overlapping admin action can't
      // double-increment.
      await restoreOrderStockOnce(payment.orderId, tx);
      return { transitioned: true };
    });
  },
};
