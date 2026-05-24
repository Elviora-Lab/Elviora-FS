import { baseApi } from '@/services/api';

import type { BlogPlaceholder } from '../types';

/**
 * Blog endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const blogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listBlog: builder.query<BlogPlaceholder[], void>({
      query: () => '/blog',
    }),
  }),
});

export const { useListBlogQuery } = blogApi;
