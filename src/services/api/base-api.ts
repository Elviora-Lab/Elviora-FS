import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQueryWithReauth } from './base-query';

/**
 * Centralized RTK Query API.
 *
 * Feature slices extend this via `baseApi.injectEndpoints` rather than
 * creating their own APIs — this keeps cache + tag invalidation coherent
 * across the entire app.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  refetchOnReconnect: true,
  refetchOnFocus: false,
  keepUnusedDataFor: 60,
  tagTypes: [
    'Auth',
    'User',
    'Product',
    'Products',
    'Category',
    'Cart',
    'Order',
    'Orders',
    'Wishlist',
    'Address',
    'Review',
    'Coupon',
    'Notification',
    'Blog',
  ],
  endpoints: () => ({}),
});
