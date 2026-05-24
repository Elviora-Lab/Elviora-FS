import { baseApi } from '@/services/api';

import type { AdminDashboardPlaceholder } from '../types';

/**
 * AdminDashboard endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const adminDashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAdminDashboard: builder.query<AdminDashboardPlaceholder[], void>({
      query: () => '/admin-dashboard',
    }),
  }),
});

export const { useListAdminDashboardQuery } = adminDashboardApi;
