import 'server-only';

import { prisma } from '@/lib/db';

import { events } from './bus';

import { analyticsServer } from '@/server/analytics';
import { sendEmail } from '@/server/email';
import { orderConfirmationEmail } from '@/server/email/templates/order-confirmation';
import { welcomeEmail } from '@/server/email/templates/welcome';
import { notifyUser } from '@/server/notifications';

// Registration guard on globalThis so listeners attach exactly once per
// process even if this module is evaluated in more than one bundle context.
const globalForListeners = globalThis as unknown as { __elvioraListenersReady?: boolean };

/**
 * Wire domain-event listeners exactly once per server instance. Invoked from
 * `instrumentation.ts` at startup. Handlers are best-effort — the bus catches
 * and logs rejections, so a failing side effect never breaks the request that
 * emitted the event.
 *
 * IMPORTANT: this is an in-process EventEmitter. On serverless it only fires
 * within the same invocation and offers no delivery guarantee. Only NON-CRITICAL
 * side effects belong here (welcome email, analytics, in-app notifications).
 * Critical, must-not-be-lost effects — payment reconciliation, order-state
 * transitions — are handled synchronously in their service/route, not via this
 * bus (see the Stripe webhook, which updates order state directly).
 */
export function registerEventListeners() {
  if (globalForListeners.__elvioraListenersReady) return;
  globalForListeners.__elvioraListenersReady = true;

  events.on('user.registered', async ({ email, name }) => {
    const { subject, html } = welcomeEmail({ name });
    await sendEmail({ to: email, subject, html });
  });

  events.on('product.viewed', async ({ productId, userId }) => {
    await analyticsServer.productView(productId, userId);
    if (userId) await analyticsServer.recordRecentlyViewed(userId, productId);
  });

  events.on('cart.line.added', async ({ productId, variantId, userId }) => {
    await analyticsServer.cartAdd(productId, variantId, userId);
  });

  events.on('order.created', async ({ orderId, userId, total, currency }) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, user: { select: { email: true } } },
    });
    if (!order) return;

    if (userId) {
      await notifyUser({
        userId,
        type: 'ORDER_UPDATE',
        title: 'Order received',
        message: `We've received order ${order.orderNumber} and will email you once it ships.`,
      });
    }

    if (order.user?.email) {
      const { subject, html } = orderConfirmationEmail({
        orderNumber: order.orderNumber,
        total,
        currency,
      });
      await sendEmail({ to: order.user.email, subject, html });
    }
  });

  events.on('order.paid', async ({ orderId }) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, orderNumber: true },
    });
    if (!order?.userId) return;
    await notifyUser({
      userId: order.userId,
      type: 'ORDER_UPDATE',
      title: 'Payment confirmed',
      message: `Payment for order ${order.orderNumber} was received. Thank you!`,
    });
  });
}
