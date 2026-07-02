import 'server-only';

import { prisma } from '@/lib/db';

/**
 * Server-side analytics — writes to the analytics tables in the DB.
 * Fire-and-forget from services; never block the request on these writes.
 */
export const analyticsServer = {
  async productView(productId: string, userId: string | null) {
    try {
      await prisma.productViewLog.create({ data: { productId, userId } });
    } catch {
      /* best-effort */
    }
  },

  async search(keyword: string, resultCount: number, userId: string | null) {
    try {
      // Column is VarChar(255) — clamp so a pathological query string can't
      // make the (best-effort) insert fail.
      await prisma.searchLog.create({
        data: { keyword: keyword.slice(0, 255), resultCount, userId },
      });
    } catch {
      /* best-effort */
    }
  },

  async cartAdd(productId: string, variantId: string | null, userId: string | null) {
    try {
      await prisma.cartEventLog.create({ data: { productId, variantId, userId } });
    } catch {
      /* best-effort */
    }
  },

  async recordRecentlyViewed(userId: string, productId: string) {
    try {
      await prisma.recentlyViewedProduct.upsert({
        where: { userId_productId: { userId, productId } },
        update: { viewedAt: new Date() },
        create: { userId, productId },
      });
    } catch {
      /* best-effort */
    }
  },
};
