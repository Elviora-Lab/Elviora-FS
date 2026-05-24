import { baseApi } from '@/services/api';

import type { FiltersPlaceholder } from '../types';

/**
 * Filters endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const filtersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFilters: builder.query<FiltersPlaceholder[], void>({
      query: () => '/filters',
    }),
  }),
});

export const { useListFiltersQuery } = filtersApi;
