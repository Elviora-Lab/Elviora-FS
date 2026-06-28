import 'server-only';

import { prisma } from '@/lib/db';

import { sendEmail } from '@/server/email';
import { abandonedCartEmail } from '@/server/email/templates/abandoned-cart';
import { notifyUser } from '@/server/notifications';

// A cart is "abandoned" once it's been idle for a few hours but not so long it's
// stale. Carts that converted have their items cleared, so "has items" already
// implies the order was never placed.
const STALE_AFTER_HOURS = 4;
const MAX_AGE_HOURS = 72;
const BATCH = 200;

export const cartRecoveryService = {
  /**
   * Find abandoned carts and send one recovery email each. Idempotent per cart
   * via `reminderSentAt` (a cart is re-eligible only if it changed after the
   * last reminder). Returns how many reminders were sent.
   */
  async sweepAbandonedCarts(now: Date = new Date()) {
    const staleBefore = new Date(now.getTime() - STALE_AFTER_HOURS * 3600_000);
    const tooOld = new Date(now.getTime() - MAX_AGE_HOURS * 3600_000);

    const carts = await prisma.cart.findMany({
      where: {
        userId: { not: null },
        updatedAt: { lt: staleBefore, gt: tooOld },
        items: { some: {} },
      },
      select: {
        id: true,
        userId: true,
        updatedAt: true,
        reminderSentAt: true,
        user: { select: { email: true, firstName: true } },
        items: {
          select: { quantity: true, product: { select: { name: true } } },
        },
      },
      take: BATCH,
    });

    let sent = 0;
    for (const cart of carts) {
      // Re-eligible only if never reminded, or the cart changed since the last
      // reminder (column-vs-column comparison Prisma can't express in `where`).
      if (cart.reminderSentAt && cart.reminderSentAt >= cart.updatedAt) continue;
      const email = cart.user?.email;
      if (!email || !cart.userId) continue;

      const itemNames = cart.items.map((i) => `${i.quantity}x ${i.product?.name ?? 'Item'}`);
      const { subject, html, text } = abandonedCartEmail({
        name: cart.user?.firstName,
        itemNames,
      });

      try {
        await sendEmail({ to: email, subject, html, text });
        await notifyUser({
          userId: cart.userId,
          type: 'ABANDONED_CART',
          title: 'You left items in your bag',
          message: `${itemNames.length} item(s) are waiting in your cart.`,
        });
        await prisma.cart.update({
          where: { id: cart.id },
          data: { reminderSentAt: now },
        });
        sent += 1;
      } catch {
        // Skip a single failed send; don't abort the batch.
      }
    }

    return { scanned: carts.length, sent };
  },
};
