import { baseApi } from '@/services/api';

import type { AddressesPlaceholder } from '../types';

/**
 * Addresses endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const addressesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAddresses: builder.query<AddressesPlaceholder[], void>({
      query: () => '/addresses',
    }),
  }),
});

export const { useListAddressesQuery } = addressesApi;
