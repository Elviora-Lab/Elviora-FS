import 'server-only';

import { prisma } from '@/lib/db';

export const blogRepo = {
  listPublished(take = 24) {
    return prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        seoDescription: true,
        content: true,
        publishedAt: true,
      },
    });
  },

  findPublishedBySlug(slug: string) {
    return prisma.blogPost.findFirst({ where: { slug, isPublished: true } });
  },
};
