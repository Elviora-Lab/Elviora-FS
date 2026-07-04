import { isProd, publicEnv } from '@/config/env';

/**
 * Meta (Facebook) Pixel — thin client-side wrapper around `window.fbq`.
 *
 * The base code is injected once by `<MetaPixel />` (see
 * `@/components/analytics/meta-pixel`). These helpers fire standard events from
 * anywhere in the app; they no-op safely until the pixel script has loaded and
 * only run in production, so call sites don't need their own guards.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export const FB_PIXEL_ID = publicEnv.NEXT_PUBLIC_FB_PIXEL_ID;

/** Load the pixel only in production and only when an ID is configured. */
export const pixelEnabled = isProd && Boolean(FB_PIXEL_ID);

type PixelParams = Record<string, unknown>;

/** Optional opts — `eventID` pairs a browser event with its server (CAPI)
 * counterpart so Meta deduplicates the two. */
type TrackOpts = { eventID?: string };

export function fbTrack(event: string, params?: PixelParams, opts?: TrackOpts): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (opts?.eventID) {
    window.fbq('track', event, params, { eventID: opts.eventID });
  } else {
    window.fbq('track', event, params);
  }
}

/** Fire a custom (non-standard) event via `trackCustom`. */
export function fbTrackCustom(event: string, params?: PixelParams): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('trackCustom', event, params);
}

export const metaPixel = {
  pageView: () => fbTrack('PageView'),

  viewContent: (p: { id: string; name: string; price: number; currency: string }) =>
    fbTrack('ViewContent', {
      content_ids: [p.id],
      content_name: p.name,
      content_type: 'product',
      value: p.price,
      currency: p.currency,
    }),

  viewCategory: (p: { slug: string; name: string }) =>
    fbTrackCustom('ViewCategory', { content_category: p.name, content_ids: [p.slug] }),

  addToCart: (p: { id: string; name: string; quantity: number; price: number; currency: string }) =>
    fbTrack('AddToCart', {
      content_ids: [p.id],
      content_name: p.name,
      content_type: 'product',
      contents: [{ id: p.id, quantity: p.quantity }],
      value: p.price * p.quantity,
      currency: p.currency,
    }),

  addToWishlist: (p: { id: string; name?: string; price?: number; currency?: string }) =>
    fbTrack('AddToWishlist', {
      content_ids: [p.id],
      content_type: 'product',
      ...(p.name ? { content_name: p.name } : {}),
      ...(p.price != null ? { value: p.price, currency: p.currency ?? 'PKR' } : {}),
    }),

  initiateCheckout: (p: { value: number; currency: string; items: number }) =>
    fbTrack('InitiateCheckout', {
      value: p.value,
      currency: p.currency,
      num_items: p.items,
    }),

  addPaymentInfo: (p: { value: number; currency: string; method: string }) =>
    fbTrack('AddPaymentInfo', {
      value: p.value,
      currency: p.currency,
      payment_method: p.method,
    }),

  /** Purchase — pass the order id as `eventID` so the browser event dedupes
   * against the server-side Conversions API Purchase. */
  purchase: (p: { orderId: string; value: number; currency: string; items: number }) =>
    fbTrack(
      'Purchase',
      { value: p.value, currency: p.currency, num_items: p.items, content_type: 'product' },
      { eventID: p.orderId },
    ),

  subscribe: (p?: { value?: number; currency?: string }) =>
    fbTrack('Subscribe', p?.value != null ? { value: p.value, currency: p.currency ?? 'PKR' } : {}),

  contact: () => fbTrack('Contact'),

  lead: (p?: { content_name?: string }) =>
    fbTrack('Lead', p ? { content_name: p.content_name } : {}),

  search: (query: string) => fbTrack('Search', { search_string: query }),

  // Store-specific custom events (build Custom Conversions on these in Ads Manager).
  couponApplied: (code: string) => fbTrackCustom('CouponApplied', { coupon: code }),
  backInStockNotify: (productId: string) =>
    fbTrackCustom('BackInStockNotify', { content_ids: [productId], content_type: 'product' }),
  skincareAssistant: () => fbTrackCustom('SkincareAssistant'),
};
