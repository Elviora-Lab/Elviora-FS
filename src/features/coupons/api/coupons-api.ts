import { baseApi } from '@/services/api';

import type { CouponsPlaceholder } from '../types';

/**
 * Coupons endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const couponsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCoupons: builder.query<CouponsPlaceholder[], void>({
      query: () => '/coupons',
    }),
  }),
});

export const { useListCouponsQuery } = couponsApi;
