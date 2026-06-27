export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
  /** Render as a non-clickable "coming soon" item (no products yet). */
  comingSoon?: boolean;
};

export const mainNav: NavItem[] = [
  {
    label: 'Makeup',
    // No `makeup` parent category exists in the DB — all current products are
    // makeup, so the parent links to the full catalog and the children are the
    // real `categories.slug` values (route is `/categories/[slug]`).
    href: '/products',
    children: [
      { label: 'Lips', href: '/categories/lips' },
      { label: 'Eyes', href: '/categories/eyes' },
      { label: 'Face', href: '/categories/face' },
      { label: 'Nails', href: '/categories/nails' },
    ],
  },
  // Skincare isn't part of the current catalog yet.
  { label: 'Skincare', href: '/categories/skincare', comingSoon: true },
  { label: 'Best Sellers', href: '/products?sort=popular' },
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'The Journal', href: '/blog' },
];

export const footerNav: Record<string, NavItem[]> = {
  Shop: [
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Bestsellers', href: '/products?sort=popular' },
    { label: 'Gift Cards', href: '/gift-cards' },
  ],
  Concierge: [
    { label: 'Skincare Consultation', href: '/ai-skincare-assistant' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Shipping & Returns', href: '/shipping' },
  ],
  House: [
    { label: 'Our Story', href: '/about' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Press', href: '/press' },
    { label: 'Careers', href: '/careers' },
  ],
  Legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Accessibility', href: '/accessibility' },
  ],
};

export const accountNav: NavItem[] = [
  { label: 'Overview', href: '/account' },
  { label: 'Orders', href: '/account/orders' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Addresses', href: '/account/addresses' },
];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Reviews', href: '/admin/reviews' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Coupons', href: '/admin/coupons' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Banners', href: '/admin/banners' },
  { label: 'Blog', href: '/admin/blog' },
];
