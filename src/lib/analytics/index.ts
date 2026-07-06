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
    metaPixel.addToCart({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      price: p.price,
      currency: p.currency,
    });
    ga.addToCart(p);
  },

  addToWishlist(p: { id: string; name?: string; price?: number; currency?: string }) {
    logDev('add_to_wishlist', p);
    metaPixel.addToWishlist(p);
    ga.addToWishlist(p);
  },

  beginCheckout(p: { value: number; currency: string; count: number; items?: GaItem[] }) {
    logDev('begin_checkout', p);
    metaPixel.initiateCheckout({ value: p.value, currency: p.currency, items: p.count });
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
