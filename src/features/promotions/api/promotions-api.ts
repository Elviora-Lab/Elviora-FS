import { baseApi } from '@/services/api';

import type { SpendTier } from '@/lib/promotions';

/** Storefront access to the active Spend & Save tiers (for the rewards nudge). */
export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSpendTiers: builder.query<{ tiers: SpendTier[] }, void>({
      query: () => '/promotions/spend-tiers',
    }),
  }),
});

export const { useGetSpendTiersQuery } = promotionsApi;
