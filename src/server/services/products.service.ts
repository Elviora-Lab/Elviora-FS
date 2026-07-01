import 'server-only';

import { toProductCard } from './_mappers/product.mapper';

import { cache } from '@/server/cache';
import { events } from '@/server/events';
import { NotFoundError } from '@/server/http/errors';
import {
  type ProductListFilters,
  type ProductListSort,
  productsRepo,
} from '@/server/repositories/products.repo';

export const productsService = {
  /**
   * Returns products in the `ProductCardData` shape — already projected so
   * the client doesn't have to know about Prisma's row layout (`images[]`,
   * `Decimal`, etc.). `imageUrl` is guaranteed to be a string.
   */
  async list(filters: ProductListFilters, sort: ProductListSort, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const { items, total } = await productsRepo.list(filters, sort, skip, pageSize);
    return { items: items.map(toProductCard), total };
  },

  async getBySlug(
    slug: string,
    viewer: { userId?: string | null; track?: boolean; allowInactive?: boolean } = {},
  ) {
    const product = await cache.wrap(`product:${slug}`, 120, () => productsRepo.findBySlug(slug));
    if (!product) throw new NotFoundError('Product not found');

    // Hidden (isActive=false) products are not publicly reachable — treat them
    // as not-found for the storefront. Admin preview passes `allowInactive`.
    if (!product.isActive && !viewer.allowInactive) throw new NotFoundError('Product not found');

    // Count a view only for the actual page render — `generateMetadata` also
    // calls this and passes `track: false` to avoid double-counting.
    if (viewer.track !== false) {
      events.emit('product.viewed', { productId: product.id, userId: viewer.userId ?? null });
    }

    return product;
  },

  async getRelated(slug: string, limit = 4) {
    const root = await productsRepo.findBySlug(slug);
    if (!root) throw new NotFoundError('Product not found');
    const related = await productsRepo.findRelated(root.id, root.categoryId, limit);
    return related.map(toProductCard);
  },

  invalidate(slug: string) {
    return cache.delete(`product:${slug}`);
  },
};
