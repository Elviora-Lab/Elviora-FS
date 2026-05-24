import { baseApi } from '@/services/api';

import type { CheckoutPlaceholder } from '../types';

/**
 * Checkout endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const checkoutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCheckout: builder.query<CheckoutPlaceholder[], void>({
      query: () => '/checkout',
    }),
  }),
});

export const { useListCheckoutQuery } = checkoutApi;
