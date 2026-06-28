import 'server-only';

import { prisma } from '@/lib/db';

import { sendEmail } from '@/server/email';
import { backInStockEmail } from '@/server/email/templates/back-in-stock';

export const stockNotifyService = {
  /**
   * Email everyone waiting on a variant that is now back in stock, then stamp
   * notifiedAt so each waiter is emailed only once per restock.
   */
  async sweepRestocked(now: Date = new Date()) {
    const pending = await prisma.stockNotification.findMany({
      where: {
        notifiedAt: null,
        variant: { stockQuantity: { gt: 0 }, isActive: true },
      },
      select: {
        id: true,
        email: true,
        product: { select: { name: true, slug: true } },
      },
      take: 500,
    });

    let sent = 0;
    for (const row of pending) {
      try {
        const { subject, html, text } = backInStockEmail({
          productName: row.product.name,
          productSlug: row.product.slug,
        });
        await sendEmail({ to: row.email, subject, html, text });
        await prisma.stockNotification.update({
          where: { id: row.id },
          data: { notifiedAt: now },
        });
        sent += 1;
      } catch {
        // Skip a single failed send; don't abort the batch.
      }
    }

    return { scanned: pending.length, sent };
  },
};
