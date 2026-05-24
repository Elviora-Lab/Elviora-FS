import { baseApi } from '@/services/api';

import type { CategoriesPlaceholder } from '../types';

/**
 * Categories endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query<CategoriesPlaceholder[], void>({
      query: () => '/categories',
    }),
  }),
});

export const { useListCategoriesQuery } = categoriesApi;
