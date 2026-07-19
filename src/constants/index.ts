export const QUERY_KEYS = {
  products: 'products',
  product: 'product',
  cart: 'cart',
  orders: 'orders',
  user: 'user',
} as const;

export const STORAGE_KEYS = {
  cart: 'kitchenly.cart.v1',
  wishlist: 'kitchenly.wishlist.v1',
  recentSearches: 'kitchenly.recent-searches.v1',
} as const;

export const PAGINATION = {
  defaultPageSize: 24,
  pageSizeOptions: [12, 24, 48, 96] as const,
  maxPageSize: 100,
} as const;

export const CURRENCY = {
  default: 'PKR',
  supported: ['PKR'] as const,
} as const;

export const REVALIDATE = {
  short: 60,
  medium: 60 * 15,
  long: 60 * 60,
  day: 60 * 60 * 24,
} as const;
