export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
};

export const mainNav: NavItem[] = [
  {
    label: 'Skincare',
    href: '/categories/skincare',
    children: [
      { label: 'Cleansers', href: '/categories/skincare/cleansers' },
      { label: 'Serums', href: '/categories/skincare/serums' },
      { label: 'Moisturizers', href: '/categories/skincare/moisturizers' },
      { label: 'Sunscreens', href: '/categories/skincare/sunscreens' },
      { label: 'Masks', href: '/categories/skincare/masks' },
    ],
  },
  {
    label: 'Makeup',
    href: '/categories/makeup',
    children: [
      { label: 'Lip', href: '/categories/makeup/lip' },
      { label: 'Eye', href: '/categories/makeup/eye' },
      { label: 'Face', href: '/categories/makeup/face' },
      { label: 'Brushes', href: '/categories/makeup/brushes' },
    ],
  },
  { label: 'Body', href: '/categories/body' },
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
