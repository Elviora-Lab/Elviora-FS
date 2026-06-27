import 'server-only';

import { prisma } from '@/lib/db';

import { events } from './bus';

import { analyticsServer } from '@/server/analytics';
import { sendEmail } from '@/server/email';
import { welcomeEmail } from '@/server/email/templates/welcome';
import { notifyUser } from '@/server/notifications';

let registered = false;

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
  if (registered) return;
  registered = true;

  events.on('user.registered', async ({ email, name }) => {
    const { subject, html } = welcomeEmail({ name });
    await sendEmail({ to: email, subject, html });
  });

  events.on('product.viewed', async ({ productId, userId }) => {
    await analyticsServer.productView(productId, userId);
    if (userId) await analyticsServer.recordRecentlyViewed(userId, productId);
  });

  events.on('order.created', async ({ userId }) => {
    if (!userId) return; // guest checkout — no in-app inbox to write to
    await notifyUser({
      userId,
      type: 'ORDER_UPDATE',
      title: 'Order received',
      message: "We've received your order and will email you once it ships.",
    });
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
