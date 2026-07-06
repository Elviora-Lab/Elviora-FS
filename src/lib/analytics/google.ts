import { isProd, publicEnv } from '@/config/env';

/**
 * Google Analytics 4 — thin client-side wrapper around `window.gtag`.
 *
 * The gtag.js loader is injected once by `<GoogleAnalytics />` (see
 * `@/components/analytics/google-analytics`). These helpers fire GA4
 * recommended events (with the `items[]` + `value`/`currency` e-commerce
 * schema) from anywhere in the app; they no-op safely until gtag has loaded and
 * only run in production, so call sites don't need their own guards.
 *
 * Mirror of the Meta Pixel wrapper (`@/lib/analytics/meta-pixel`). Both are
 * fanned out from the unified `analytics` facade (`@/lib/analytics`).
 */

export const GA_ID = publicEnv.NEXT_PUBLIC_GA_ID;

/** Load GA only in production and only when a Measurement ID is configured. */
export const gaEnabled = isProd && Boolean(GA_ID);

/** GA4 item shape (the subset we populate). */
export type GaItem = {
  item_id: string;
  item_name?: string;
  item_brand?: string;
  item_variant?: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

type GaParams = Record<string, unknown>;

export function gtagEvent(event: string, params?: GaParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params ?? {});
}

export const ga = {
  /** SPA page_view — the initial one is sent by the gtag `config` call. */
  pageView: (params?: { page_location?: string; page_title?: string; page_path?: string }) =>
    gtagEvent('page_view', params),

  viewItem: (p: { id: string; name: string; price: number; currency: string; brand?: string }) =>
    gtagEvent('view_item', {
      currency: p.currency,
      value: p.price,
      items: [
        {
          item_id: p.id,
          item_name: p.name,
          ...(p.brand ? { item_brand: p.brand } : {}),
          price: p.price,
        },
      ],
    }),

  /** Category page — GA4 models this as viewing a list of items. */
  viewCategory: (p: { slug: string; name: string }) =>
    gtagEvent('view_item_list', { item_list_id: p.slug, item_list_name: p.name }),

  addToCart: (p: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    currency: string;
    variant?: string;
  }) =>
    gtagEvent('add_to_cart', {
      currency: p.currency,
      value: p.price * p.quantity,
      items: [
        {
          item_id: p.id,
          item_name: p.name,
          ...(p.variant ? { item_variant: p.variant } : {}),
          price: p.price,
          quantity: p.quantity,
        },
      ],
    }),

  addToWishlist: (p: { id: string; name?: string; price?: number; currency?: string }) =>
    gtagEvent('add_to_wishlist', {
      ...(p.price != null ? { currency: p.currency ?? 'PKR', value: p.price } : {}),
      items: [
        {
          item_id: p.id,
          ...(p.name ? { item_name: p.name } : {}),
          ...(p.price != null ? { price: p.price } : {}),
        },
      ],
    }),

  beginCheckout: (p: { value: number; currency: string; items?: GaItem[] }) =>
    gtagEvent('begin_checkout', {
      currency: p.currency,
      value: p.value,
      ...(p.items?.length ? { items: p.items } : {}),
    }),

  addPaymentInfo: (p: { value: number; currency: string; method: string }) =>
    gtagEvent('add_payment_info', {
      currency: p.currency,
      value: p.value,
      payment_type: p.method,
    }),

  /** Purchase — `transaction_id` lets GA4 dedupe repeat sends of the same order. */
  purchase: (p: { orderId: string; value: number; currency: string; items?: GaItem[] }) =>
    gtagEvent('purchase', {
      transaction_id: p.orderId,
      currency: p.currency,
      value: p.value,
      ...(p.items?.length ? { items: p.items } : {}),
    }),

  search: (query: string) => gtagEvent('search', { search_term: query }),

  couponApplied: (code: string) =>
    gtagEvent('select_promotion', { coupon: code, promotion_name: code }),

  // Store-specific custom events (build these into GA4 conversions/audiences).
  newsletterSignup: () => gtagEvent('newsletter_signup'),
  backInStockNotify: (productId: string) =>
    gtagEvent('back_in_stock_notify', { items: [{ item_id: productId }] }),
  skincareAssistant: () => gtagEvent('skincare_assistant'),
  contact: () => gtagEvent('contact'),
};
