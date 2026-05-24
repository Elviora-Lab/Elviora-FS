import { baseApi } from '@/services/api';

import type { UserProfilePlaceholder } from '../types';

/**
 * UserProfile endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const userProfileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listUserProfile: builder.query<UserProfilePlaceholder[], void>({
      query: () => '/user-profile',
    }),
  }),
});

export const { useListUserProfileQuery } = userProfileApi;
