import 'server-only';

import { prisma } from '@/lib/db';

const activeChildren = {
  where: { isActive: true },
  orderBy: [{ sortOrder: 'asc' as const }, { name: 'asc' as const }],
};

export const categoriesRepo = {
  listActive() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  /** Top-level categories with their active subcategories nested. */
  listTree() {
    return prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { children: activeChildren },
    });
  },

  findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        children: activeChildren,
        // Parent with its children so a subcategory page can render its
        // siblings (the chip row) and a breadcrumb without a second query.
        parent: { include: { children: activeChildren } },
      },
    });
  },
};
