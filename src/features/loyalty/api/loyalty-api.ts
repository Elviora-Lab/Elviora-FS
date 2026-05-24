import { baseApi } from '@/services/api';

import type { LoyaltyPlaceholder } from '../types';

/**
 * Loyalty endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const loyaltyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listLoyalty: builder.query<LoyaltyPlaceholder[], void>({
      query: () => '/loyalty',
    }),
  }),
});

export const { useListLoyaltyQuery } = loyaltyApi;
