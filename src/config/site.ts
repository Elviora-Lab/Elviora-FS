import { publicEnv } from './env';

export const siteConfig = {
  name: publicEnv.NEXT_PUBLIC_SITE_NAME,
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  tagline: 'Refined skincare. Quietly powerful.',
  description:
    'Elviora is a modern luxury house of skincare and cosmetics, crafted with rare botanicals and clinical precision.',
  ogImage: '/og.jpg',
  locale: 'en-US',
  defaultCurrency: 'USD',
  social: {
    instagram: 'https://instagram.com/elviora',
    tiktok: 'https://tiktok.com/@elviora',
    pinterest: 'https://pinterest.com/elviora',
    youtube: 'https://youtube.com/@elviora',
  },
  contact: {
    email: 'concierge@elviora.com',
    phone: '+1 (800) 555-0119',
  },
  keywords: [
    'luxury skincare',
    'cosmetics',
    'serum',
    'moisturizer',
    'clean beauty',
    'editorial beauty',
    'Elviora',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
