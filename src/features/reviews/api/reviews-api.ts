import { baseApi } from '@/services/api';

import type { ReviewsPlaceholder } from '../types';

/**
 * Reviews endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listReviews: builder.query<ReviewsPlaceholder[], void>({
      query: () => '/reviews',
    }),
  }),
});

export const { useListReviewsQuery } = reviewsApi;
