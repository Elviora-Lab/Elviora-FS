import 'server-only';

import { cache } from '@/server/cache';
import { brandsRepo } from '@/server/repositories/brands.repo';

export const brandsService = {
  /** Active brands (with product counts) — small and stable, cache 5 min. */
  list() {
    return cache.wrap('brands:active', 300, () => brandsRepo.listActive());
  },

  getBySlug(slug: string) {
    return cache.wrap(`brands:slug:${slug}`, 300, () => brandsRepo.findBySlug(slug));
  },
};
