import { publicEnv } from './env';

export const siteConfig = {
  name: publicEnv.NEXT_PUBLIC_SITE_NAME,
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  tagline: 'The Art of Radiant Beauty',
  /**
   * Elviora — from the Latin elvīra ("she who illuminates") softened
   * with the lyrical Italian ending -iora. A luxury house of skincare
   * and cosmetics, formulated with rare botanicals and clinical precision.
   */
  description:
    'Elviora — the art of radiant beauty. A luxury house of skincare and cosmetics, formulated with rare botanicals and clinical precision.',
  meaning:
    'Elviora — from the Latin elvīra, "she who illuminates", softened with the lyrical Italian ending -iora.',
  locale: 'en-PK',
  defaultCurrency: 'PKR',
  // Only accounts we actually own — `sameAs` must be truthful for Google to
  // trust it. Add TikTok/YouTube/Pinterest here once those profiles exist.
  social: {
    instagram: 'https://www.instagram.com/elviora.com.pk',
    facebook: 'https://www.facebook.com/people/Elviora/61591687198185/',
  },
  contact: {
    email: 'elviora192@gmail.com',
    phone: '+92 343 0803769',
  },
  /**
   * Return / sender address printed on every shipping label.
   * Change this when the warehouse moves.
   */
  shippingFrom: {
    name: 'Elviora HQ',
    addressLine1: '12 Khayaban-e-Iqbal, F-7',
    addressLine2: '',
    city: 'Islamabad',
    area: 'F-7',
    postalCode: '44000',
    country: 'PK',
    phone: '+92 (51) 111 0001',
  },
  keywords: [
    'luxury skincare Pakistan',
    'luxury cosmetics Pakistan',
    'serum',
    'moisturizer',
    'clean beauty',
    'editorial beauty',
    'Elviora',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
