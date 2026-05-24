import type { Paginated } from '@/services/api';
import { baseApi } from '@/services/api';

import type { Product, ProductListQuery } from '../types';

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProducts: builder.query<Paginated<Product>, ProductListQuery | void>({
      query: (params) => ({ url: '/products', params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({ type: 'Product' as const, id: p.id })),
              { type: 'Products' as const, id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),
    getProduct: builder.query<Product, { slug: string }>({
      query: ({ slug }) => `/products/${slug}`,
      providesTags: (_r, _e, arg) => [{ type: 'Product', id: arg.slug }],
    }),
    relatedProducts: builder.query<Product[], { slug: string; limit?: number }>({
      query: ({ slug, limit = 4 }) => ({ url: `/products/${slug}/related`, params: { limit } }),
    }),
    searchProducts: builder.query<
      Paginated<Product>,
      { q: string; page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: '/products/search', params }),
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useRelatedProductsQuery,
  useSearchProductsQuery,
  useLazySearchProductsQuery,
} = productsApi;
