import { publicEnv } from './env';

export const siteConfig = {
  name: publicEnv.NEXT_PUBLIC_SITE_NAME,
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  tagline: 'Smart Living Essentials',
  /**
   * Kitchenly — everyday tools that make a house run smoothly. Kitchen
   * gadgets, home organization, cleaning and utility essentials, chosen for
   * build quality and priced for daily use.
   */
  description:
    'Kitchenly — smart living essentials. Kitchen gadgets, home organization, cleaning and utility products chosen for build quality and everyday value, delivered across Pakistan.',
  meaning: 'Kitchenly — the kitchen way of doing things: practical, organized, and built to last.',
  locale: 'en-PK',
  defaultCurrency: 'PKR',
  // Only accounts we actually own — `sameAs` must be truthful for Google to
  // trust it. Swap these once the Kitchenly profiles are live.
  social: {
    instagram: 'https://www.instagram.com/kitchenly.pk',
    facebook: 'https://www.facebook.com/kitchenly.pk',
    youtube: 'https://www.youtube.com/@kitchenly-pk',
  },
  contact: {
    email: 'support@kitchenly.com.pk',
    phone: '+92 343 0803769',
  },
  /**
   * Return / sender address printed on every shipping label.
   * Change this when the warehouse moves.
   */
  shippingFrom: {
    name: 'Kitchenly HQ',
    addressLine1: '12 Khayaban-e-Iqbal, F-7',
    addressLine2: '',
    city: 'Islamabad',
    area: 'F-7',
    postalCode: '44000',
    country: 'PK',
    phone: '+92 (51) 111 0001',
  },
  keywords: [
    'kitchen gadgets Pakistan',
    'household essentials Pakistan',
    'kitchen tools',
    'home organization',
    'cleaning supplies',
    'storage solutions',
    'Kitchenly',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
