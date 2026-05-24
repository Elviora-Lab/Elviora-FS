import { baseApi } from '@/services/api';

import type { SearchPlaceholder } from '../types';

/**
 * Search endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSearch: builder.query<SearchPlaceholder[], void>({
      query: () => '/search',
    }),
  }),
});

export const { useListSearchQuery } = searchApi;
