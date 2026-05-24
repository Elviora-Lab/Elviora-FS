import 'server-only';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

export type ProductListFilters = {
  category?: string; // slug
  q?: string; // free-text
  priceMin?: number;
  priceMax?: number;
  skinType?: string;
  concern?: string; // skin-concern slug
  tag?: string; // tag slug
};

export type ProductListSort = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating';

const SORT_MAP: Record<ProductListSort, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  popular: { createdAt: 'desc' }, // replace with view-count when materialized
  rating: { createdAt: 'desc' }, // replace with rating avg when materialized
};

export const productsRepo = {
  async list(filters: ProductListFilters, sort: ProductListSort, skip: number, take: number) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: 'insensitive' } },
              { shortDescription: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.priceMin !== undefined || filters.priceMax !== undefined
        ? {
            price: {
              ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
              ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
            },
          }
        : {}),
      ...(filters.concern
        ? { skinConcerns: { some: { skinConcern: { slug: filters.concern } } } }
        : {}),
      ...(filters.tag ? { tagMappings: { some: { tag: { slug: filters.tag } } } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: SORT_MAP[sort],
        skip,
        take,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          brand: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  },

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        variants: { where: { isActive: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        skinConcerns: { include: { skinConcern: true } },
        ingredients: { include: { ingredient: true } },
        tagMappings: { include: { tag: true } },
      },
    });
  },

  async findRelated(productId: string, categoryId: string | null, limit: number) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        ...(categoryId ? { categoryId } : {}),
      },
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
    });
  },
};
