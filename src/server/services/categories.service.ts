import 'server-only';

import { cache } from '@/server/cache';
import { categoriesRepo } from '@/server/repositories/categories.repo';

export const categoriesService = {
  list() {
    // Category tree is hot, stable, and small — cache for 5 minutes.
    return cache.wrap('categories:active', 300, () => categoriesRepo.listActive());
  },

  /** Top-level categories with subcategories nested (nav / API shape). */
  tree() {
    return cache.wrap('categories:tree', 300, () => categoriesRepo.listTree());
  },

  /** One category with its children, parent, and siblings (via parent). */
  getBySlug(slug: string) {
    return cache.wrap(`categories:slug:${slug}`, 300, () => categoriesRepo.findBySlug(slug));
  },
};
