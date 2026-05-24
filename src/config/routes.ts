export const routes = {
  home: '/',
  products: '/products',
  productDetail: (slug: string) => `/products/${slug}`,
  category: (slug: string) => `/categories/${slug}`,
  cart: '/cart',
  checkout: '/checkout',
  search: '/search',
  blog: '/blog',
  blogPost: (slug: string) => `/blog/${slug}`,
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    logout: '/api/auth/logout',
  },
  account: {
    overview: '/account',
    orders: '/account/orders',
    orderDetail: (id: string) => `/account/orders/${id}`,
    wishlist: '/account/wishlist',
    addresses: '/account/addresses',
  },
  admin: {
    dashboard: '/admin',
    products: '/admin/products',
    orders: '/admin/orders',
    users: '/admin/users',
    coupons: '/admin/coupons',
    analytics: '/admin/analytics',
    banners: '/admin/banners',
    blog: '/admin/blog',
  },
} as const;

export const PROTECTED_PREFIXES = ['/account', '/checkout'] as const;
export const ADMIN_PREFIXES = ['/admin'] as const;
export const AUTH_ROUTES = ['/login', '/register', '/forgot-password'] as const;
