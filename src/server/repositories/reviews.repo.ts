import 'server-only';

import { prisma } from '@/lib/db';

export const reviewsRepo = {
  /** Approved reviews for a product, newest first, with the author's name. */
  listApproved(productId: string, take = 10) {
    return prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        isVerifiedPurchase: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
  },

  /** Average rating + count over approved reviews. */
  async summary(productId: string) {
    const agg = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return { average: agg._avg.rating ?? 0, count: agg._count.rating };
  },
};
