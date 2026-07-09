import { isProd, publicEnv } from '@/config/env';

/**
 * Google Analytics 4 — client-side wrapper around `window.gtag`.
 *
 * The gtag.js loader is injected once by `<GoogleAnalytics />` (see
 * `@/components/analytics/google-analytics`). These helpers fire the full set of
 * GA4 **recommended events** (the `items[]` + `value`/`currency` e-commerce
 * schema) from anywhere in the app; they no-op safely until gtag has loaded and
 * only run in production, so call sites don't need their own guards.
 *
 * Fanned out from the unified `analytics` facade (`@/lib/analytics`). The
 * server-side twin (GA4 Measurement Protocol) lives in
 * `@/server/analytics/ga-measurement-protocol`.
 *
 * Event reference:
 * https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */

export const GA_ID = publicEnv.NEXT_PUBLIC_GA_ID;

/** Load GA only in production and only when a Measurement ID is configured. */
export const gaEnabled = isProd && Boolean(GA_ID);

/** When set, events carry `debug_mode: true` so they surface in GA4 DebugView. */
export const gaDebug = publicEnv.NEXT_PUBLIC_GA_DEBUG === 'true';

/**
 * GA4 item — the full recommended-schema shape. Only `item_id` (or `item_name`)
 * is required; everything else is optional and populated where we have it.
 */
export type GaItem = {
  item_id: string;
  item_name?: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
};

type GaParams = Record<string, unknown>;

/** Low-level: push a GA4 event. Adds `debug_mode` when the debug flag is on. */
export function gtagEvent(event: string, params?: GaParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, { ...(gaDebug ? { debug_mode: true } : {}), ...(params ?? {}) });
}

/** Drop `undefined`/empty values so we never send noise to GA4. */
function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

/** Money guard — GA4 `value` should be a finite number ≥ 0. */
function money(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export type GaConsent = {
  ad_storage?: 'granted' | 'denied';
  ad_user_data?: 'granted' | 'denied';
  ad_personalization?: 'granted' | 'denied';
  analytics_storage?: 'granted' | 'denied';
  functionality_storage?: 'granted' | 'denied';
  personalization_storage?: 'granted' | 'denied';
  security_storage?: 'granted' | 'denied';
};

export const ga = {
  /** SPA page_view — the initial one is sent by the gtag `config` call. */
  pageView: (params?: { page_location?: string; page_title?: string; page_path?: string }) =>
    gtagEvent('page_view', clean(params ?? {})),

  // ---- Identity ------------------------------------------------------------

  /**
   * Associate subsequent events with a signed-in user (cross-device reporting),
   * and optionally set user properties. Pass `userId: null` on logout to clear.
   */
  setUser: (p: { userId: string | null; properties?: Record<string, string | number> }) => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('set', { user_id: p.userId });
    if (p.properties && Object.keys(p.properties).length) {
      window.gtag('set', 'user_properties', p.properties);
    }
  },

  /** Update Consent Mode v2 signals (e.g. after a cookie-banner choice). */
  consentUpdate: (consent: GaConsent) => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', consent);
  },

  // ---- Discovery / lists ---------------------------------------------------

  /** A list of products was shown (PLP, search results, "you may also like"). */
  viewItemList: (p: { listId?: string; listName?: string; items: GaItem[] }) =>
    gtagEvent(
      'view_item_list',
      clean({ item_list_id: p.listId, item_list_name: p.listName, items: p.items }),
    ),

  /** A product was clicked from within a list. */
  selectItem: (p: { listId?: string; listName?: string; item: GaItem }) =>
    gtagEvent(
      'select_item',
      clean({ item_list_id: p.listId, item_list_name: p.listName, items: [p.item] }),
    ),

  viewItem: (p: { id: string; name: string; price: number; currency: string; brand?: string }) =>
    gtagEvent('view_item', {
      currency: p.currency,
      value: money(p.price),
      items: [clean({ item_id: p.id, item_name: p.name, item_brand: p.brand, price: p.price })],
    }),

  // ---- Cart ----------------------------------------------------------------

  addToCart: (p: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    currency: string;
    variant?: string;
    brand?: string;
    listId?: string;
    listName?: string;
  }) =>
    gtagEvent('add_to_cart', {
      currency: p.currency,
      value: money(p.price * p.quantity),
      items: [
        clean({
          item_id: p.id,
          item_name: p.name,
          item_variant: p.variant,
          item_brand: p.brand,
          item_list_id: p.listId,
          item_list_name: p.listName,
          price: p.price,
          quantity: p.quantity,
        }),
      ],
    }),

  removeFromCart: (p: { currency: string; value: number; items: GaItem[] }) =>
    gtagEvent('remove_from_cart', { currency: p.currency, value: money(p.value), items: p.items }),

  viewCart: (p: { currency: string; value: number; items: GaItem[] }) =>
    gtagEvent('view_cart', { currency: p.currency, value: money(p.value), items: p.items }),

  addToWishlist: (p: { id: string; name?: string; price?: number; currency?: string }) =>
    gtagEvent(
      'add_to_wishlist',
      clean({
        currency: p.price != null ? (p.currency ?? 'PKR') : undefined,
        value: money(p.price),
        items: [clean({ item_id: p.id, item_name: p.name, price: p.price })],
      }),
    ),

  // ---- Checkout funnel -----------------------------------------------------

  beginCheckout: (p: { value: number; currency: string; coupon?: string; items?: GaItem[] }) =>
    gtagEvent(
      'begin_checkout',
      clean({ currency: p.currency, value: money(p.value), coupon: p.coupon, items: p.items }),
    ),

  addShippingInfo: (p: {
    value: number;
    currency: string;
    shippingTier?: string;
    coupon?: string;
    items?: GaItem[];
  }) =>
    gtagEvent(
      'add_shipping_info',
      clean({
        currency: p.currency,
        value: money(p.value),
        shipping_tier: p.shippingTier,
        coupon: p.coupon,
        items: p.items,
      }),
    ),

  addPaymentInfo: (p: {
    value: number;
    currency: string;
    method: string;
    coupon?: string;
    items?: GaItem[];
  }) =>
    gtagEvent(
      'add_payment_info',
      clean({
        currency: p.currency,
        value: money(p.value),
        payment_type: p.method,
        coupon: p.coupon,
        items: p.items,
      }),
    ),

  /** Purchase — `transaction_id` lets GA4 dedupe repeat sends of the same order. */
  purchase: (p: {
    orderId: string;
    value: number;
    currency: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
    items?: GaItem[];
  }) =>
    gtagEvent(
      'purchase',
      clean({
        transaction_id: p.orderId,
        currency: p.currency,
        value: money(p.value),
        tax: money(p.tax),
        shipping: money(p.shipping),
        coupon: p.coupon,
        items: p.items,
      }),
    ),

  /** Full or partial refund. Omit `items` for a whole-order refund. */
  refund: (p: { orderId: string; value?: number; currency?: string; items?: GaItem[] }) =>
    gtagEvent(
      'refund',
      clean({
        transaction_id: p.orderId,
        currency: p.currency,
        value: money(p.value),
        items: p.items,
      }),
    ),

  // ---- Promotions ----------------------------------------------------------

  viewPromotion: (p: {
    promotionId?: string;
    promotionName?: string;
    creativeName?: string;
    creativeSlot?: string;
    items?: GaItem[];
  }) =>
    gtagEvent(
      'view_promotion',
      clean({
        promotion_id: p.promotionId,
        promotion_name: p.promotionName,
        creative_name: p.creativeName,
        creative_slot: p.creativeSlot,
        items: p.items,
      }),
    ),

  selectPromotion: (p: {
    promotionId?: string;
    promotionName?: string;
    creativeName?: string;
    creativeSlot?: string;
    items?: GaItem[];
  }) =>
    gtagEvent(
      'select_promotion',
      clean({
        promotion_id: p.promotionId,
        promotion_name: p.promotionName,
        creative_name: p.creativeName,
        creative_slot: p.creativeSlot,
        items: p.items,
      }),
    ),

  /** Category page — GA4 models this as viewing a list of items. */
  viewCategory: (p: { slug: string; name: string }) =>
    gtagEvent('view_item_list', { item_list_id: p.slug, item_list_name: p.name }),

  couponApplied: (code: string) =>
    gtagEvent('select_promotion', { coupon: code, promotion_name: code }),

  // ---- Engagement / lifecycle ----------------------------------------------

  search: (query: string) => gtagEvent('search', { search_term: query }),

  login: (method = 'password') => gtagEvent('login', { method }),

  signUp: (method = 'password') => gtagEvent('sign_up', { method }),

  generateLead: (p?: { value?: number; currency?: string; source?: string }) =>
    gtagEvent(
      'generate_lead',
      clean({ value: money(p?.value), currency: p?.currency, lead_source: p?.source }),
    ),

  share: (p?: { method?: string; contentType?: string; itemId?: string }) =>
    gtagEvent(
      'share',
      clean({ method: p?.method, content_type: p?.contentType, item_id: p?.itemId }),
    ),

  // Store-specific custom events (build these into GA4 conversions/audiences).
  newsletterSignup: () => gtagEvent('newsletter_signup'),
  backInStockNotify: (productId: string) =>
    gtagEvent('back_in_stock_notify', { items: [{ item_id: productId }] }),
  skincareAssistant: () => gtagEvent('skincare_assistant'),
  contact: () => gtagEvent('contact'),
};
