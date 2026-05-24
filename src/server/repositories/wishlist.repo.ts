import 'server-only';

import { prisma } from '@/lib/db';

export const wishlistRepo = {
  /** Wishlist rows joined with the product (and its primary image + brand). */
  listForUser(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            brand: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });
  },

  /** Just the productIds — used by the Hydrator to keep the heart icons in sync. */
  async productIdsForUser(userId: string): Promise<string[]> {
    const rows = await prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true },
    });
    return rows.map((r) => r.productId);
  },

  add(userId: string, productId: string) {
    return prisma.wishlist.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
  },

  remove(userId: string, productId: string) {
    return prisma.wishlist.deleteMany({ where: { userId, productId } });
  },
};
