import 'server-only';

import { prisma } from '@/lib/db';

export const categoriesRepo = {
  listActive() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
  },
};
