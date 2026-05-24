import { baseApi } from '@/services/api';

import type { OrdersPlaceholder } from '../types';

/**
 * Orders endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listOrders: builder.query<OrdersPlaceholder[], void>({
      query: () => '/orders',
    }),
  }),
});

export const { useListOrdersQuery } = ordersApi;
