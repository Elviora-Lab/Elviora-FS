import 'server-only';

import { cache } from '@/server/cache';
import { categoriesRepo } from '@/server/repositories/categories.repo';

export const categoriesService = {
  list() {
    // Category tree is hot, stable, and small — cache for 5 minutes.
    return cache.wrap('categories:active', 300, () => categoriesRepo.listActive());
  },
};
