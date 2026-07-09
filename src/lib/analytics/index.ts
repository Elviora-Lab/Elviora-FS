import { isProd } from '@/config/env';

import { ga, type GaItem } from './google';
import { metaPixel } from './meta-pixel';

/**
 * Unified analytics facade.
 *
 * Every tracked user action calls ONE semantic method here, which fans out to
 * both destinations — the Meta Pixel (`@/lib/analytics/meta-pixel`) and Google
 * Analytics 4 (`@/lib/analytics/google`). Each destination self-guards (no-ops
 * until its script has loaded, production only), so call sites stay clean.
 *
 * The Meta calls are intentionally identical to what the call sites fired
 * before this facade existed — in particular `purchase` keeps `orderId` as the
 * Pixel `eventID` so it still dedupes against the server-side Conversions API.
 * To add another destination later (e.g. a server beacon), add it here once.
 */

/** In dev, neither script loads — log the semantic event so it's still visible. */
function logDev(event: string, payload?: unknown): void {
  if (isProd || typeof window === 'undefined') return;
  // eslint-disable-next-line no-console
  console.log('[analytics]', event, payload ?? '');
}

/** A fresh event id shared by the browser pixel + its CAPI twin so Meta dedupes
 *  the pair (falls back to a random string on very old browsers). */
function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `evt-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

/**
 * Relay an event to the server-side Conversions API (`/api/v1/track`), which
 * sends it to Meta with advanced matching from the request (cookies/IP/UA +
 * session). Fire-and-forget with `keepalive` so it survives a navigation; the
 * server no-ops unless CAPI is configured. Production only — the browser pixel
 * is off in dev anyway, so there's nothing to dedupe against.
 */
function capiRelay(event: 'AddToCart' | 'InitiateCheckout', eventId: string, customData: unknown) {
  if (!isProd || typeof window === 'undefined') return;
  try {
    void fetch('/api/v1/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, eventId, eventSourceUrl: window.location.href, customData }),
      keepalive: true,
    });
  } catch {
    /* best-effort */
  }
}

export const analytics = {
  viewItem(p: { id: string; name: string; price: number; currency: string; brand?: string }) {
    logDev('view_item', p);
    metaPixel.viewContent({ id: p.id, name: p.name, price: p.price, currency: p.currency });
    ga.viewItem(p);
  },

  viewCategory(p: { slug: string; name: string }) {
    logDev('view_category', p);
    metaPixel.viewCategory(p);
    ga.viewCategory(p);
  },

  addToCart(p: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    currency: string;
    variant?: string;
  }) {
    logDev('add_to_cart', p);
    const eventId = newEventId();
    metaPixel.addToCart(
      { id: p.id, name: p.name, quantity: p.quantity, price: p.price, currency: p.currency },
      eventId,
    );
    capiRelay('AddToCart', eventId, {
      value: p.price * p.quantity,
      currency: p.currency,
      content_ids: [p.id],
      content_type: 'product',
    });
    ga.addToCart(p);
  },

  /** Attach Advanced Matching (email/phone) to the browser pixel — call once
   *  the shopper's contact details are known (e.g. at checkout). */
  identify(p: { email?: string | null; phone?: string | null }) {
    logDev('identify', p);
    metaPixel.identify(p);
  },

  addToWishlist(p: { id: string; name?: string; price?: number; currency?: string }) {
    logDev('add_to_wishlist', p);
    metaPixel.addToWishlist(p);
    ga.addToWishlist(p);
  },

  beginCheckout(p: { value: number; currency: string; count: number; items?: GaItem[] }) {
    logDev('begin_checkout', p);
    const eventId = newEventId();
    metaPixel.initiateCheckout({ value: p.value, currency: p.currency, items: p.count }, eventId);
    capiRelay('InitiateCheckout', eventId, {
      value: p.value,
      currency: p.currency,
      num_items: p.count,
      content_type: 'product',
      ...(p.items?.length ? { content_ids: p.items.map((i) => i.item_id) } : {}),
    });
    ga.beginCheckout({ value: p.value, currency: p.currency, items: p.items });
  },

  addPaymentInfo(p: { value: number; currency: string; method: string }) {
    logDev('add_payment_info', p);
    metaPixel.addPaymentInfo(p);
    ga.addPaymentInfo(p);
  },

  purchase(p: {
    orderId: string;
    value: number;
    currency: string;
    count: number;
    items?: GaItem[];
  }) {
    logDev('purchase', p);
    metaPixel.purchase({
      orderId: p.orderId,
      value: p.value,
      currency: p.currency,
      items: p.count,
    });
    ga.purchase({ orderId: p.orderId, value: p.value, currency: p.currency, items: p.items });
  },

  search(query: string) {
    logDev('search', query);
    metaPixel.search(query);
    ga.search(query);
  },

  couponApplied(code: string) {
    logDev('coupon_applied', code);
    metaPixel.couponApplied(code);
    ga.couponApplied(code);
  },

  newsletterSignup() {
    logDev('newsletter_signup');
    metaPixel.subscribe();
    ga.newsletterSignup();
  },

  backInStockNotify(productId: string) {
    logDev('back_in_stock_notify', productId);
    metaPixel.backInStockNotify(productId);
    ga.backInStockNotify(productId);
  },

  skincareAssistant() {
    logDev('skincare_assistant');
    metaPixel.skincareAssistant();
    ga.skincareAssistant();
  },

  contact() {
    logDev('contact');
    metaPixel.contact();
    ga.contact();
  },
};

export type { GaItem };
