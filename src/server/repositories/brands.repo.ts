import 'server-only';

import { prisma } from '@/lib/db';

export const brandsRepo = {
  /** Active brands with their sellable product count, for filters and menus. */
  listActive() {
    return prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
  },

  findBySlug(slug: string) {
    return prisma.brand.findUnique({ where: { slug } });
  },
};
