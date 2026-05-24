import { baseApi } from '@/services/api';

type WishlistIdsResponse = { productIds: string[] };

export const wishlistApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWishlistIds: builder.query<WishlistIdsResponse, void>({
      query: () => '/wishlist',
      providesTags: ['Wishlist'],
    }),
  }),
});

export const { useGetWishlistIdsQuery } = wishlistApi;
