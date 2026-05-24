import { isProd } from '@/config/env';

type EventPayload = Record<string, unknown>;

export function track(event: string, payload: EventPayload = {}): void {
  if (typeof window === 'undefined') return;
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.log('[analytics:dev]', event, payload);
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...payload });
}

export const analytics = {
  productView: (p: { id: string; name: string; price: number; currency: string }) =>
    track('product_view', p),
  addToCart: (p: { id: string; name: string; quantity: number; price: number; currency: string }) =>
    track('add_to_cart', p),
  beginCheckout: (p: { value: number; currency: string; items: number }) =>
    track('begin_checkout', p),
  purchase: (p: { orderId: string; value: number; currency: string; items: number }) =>
    track('purchase', p),
  search: (q: string) => track('search', { search_term: q }),
  signIn: (method: string) => track('sign_in', { method }),
};
