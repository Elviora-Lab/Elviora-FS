import 'server-only';

import { cache } from '@/server/cache';
import { events } from '@/server/events';
import { NotFoundError } from '@/server/http/errors';
import {
  type ProductListFilters,
  type ProductListSort,
  productsRepo,
} from '@/server/repositories/products.repo';

export const productsService = {
  async list(filters: ProductListFilters, sort: ProductListSort, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    return productsRepo.list(filters, sort, skip, pageSize);
  },

  async getBySlug(slug: string, viewer: { userId: string | null } = { userId: null }) {
    // Cache product detail aggressively — invalidated on admin write.
    const product = await cache.wrap(`product:${slug}`, 120, () => productsRepo.findBySlug(slug));
    if (!product) throw new NotFoundError('Product not found');

    events.emit('product.viewed', { productId: product.id, userId: viewer.userId });

    return product;
  },

  async getRelated(slug: string, limit = 4) {
    const root = await productsRepo.findBySlug(slug);
    if (!root) throw new NotFoundError('Product not found');
    return productsRepo.findRelated(root.id, root.categoryId, limit);
  },

  invalidate(slug: string) {
    return cache.delete(`product:${slug}`);
  },
};
