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

export function fbTrack(event: string, params?: PixelParams): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', event, params);
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

  addToCart: (p: { id: string; name: string; quantity: number; price: number; currency: string }) =>
    fbTrack('AddToCart', {
      content_ids: [p.id],
      content_name: p.name,
      content_type: 'product',
      contents: [{ id: p.id, quantity: p.quantity }],
      value: p.price * p.quantity,
      currency: p.currency,
    }),

  initiateCheckout: (p: { value: number; currency: string; items: number }) =>
    fbTrack('InitiateCheckout', {
      value: p.value,
      currency: p.currency,
      num_items: p.items,
    }),

  purchase: (p: { orderId: string; value: number; currency: string; items: number }) =>
    fbTrack('Purchase', {
      value: p.value,
      currency: p.currency,
      num_items: p.items,
      content_type: 'product',
    }),

  search: (query: string) => fbTrack('Search', { search_string: query }),
};
