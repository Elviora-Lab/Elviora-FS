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
      // Claim BEFORE sending: the conditional update lets exactly one sweep
      // win each row, so overlapping cron runs can't email the same waiter
      // twice. A row that fails to send is un-claimed for the next sweep.
      const { count } = await prisma.stockNotification.updateMany({
        where: { id: row.id, notifiedAt: null },
        data: { notifiedAt: now },
      });
      if (count === 0) continue; // another sweep already claimed it

      try {
        const { subject, html, text } = backInStockEmail({
          productName: row.product.name,
          productSlug: row.product.slug,
        });
        await sendEmail({ to: row.email, subject, html, text });
        sent += 1;
      } catch {
        // Release the claim so a later sweep retries this waiter.
        await prisma.stockNotification
          .updateMany({ where: { id: row.id }, data: { notifiedAt: null } })
          .catch(() => undefined);
      }
    }

    return { scanned: pending.length, sent };
  },
};
