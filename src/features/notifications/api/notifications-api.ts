import { baseApi } from '@/services/api';

import type { NotificationsPlaceholder } from '../types';

/**
 * Notifications endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<NotificationsPlaceholder[], void>({
      query: () => '/notifications',
    }),
  }),
});

export const { useListNotificationsQuery } = notificationsApi;
