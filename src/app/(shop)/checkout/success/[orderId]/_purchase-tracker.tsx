'use client';

import { useEffect, useRef } from 'react';

import { analytics, type GaItem } from '@/lib/analytics';

/**
 * Fires the Purchase event once when the order-confirmation page loads (Meta
 * Pixel Purchase + GA4 `purchase`). Lives in a client component because the
 * success page is a Server Component. One-shot per mount so a refresh doesn't
 * re-fire it in the same view; `orderId` also dedupes downstream (Pixel eventID
 * / GA4 transaction_id).
 */
export function PurchaseTracker({
  orderId,
  value,
  currency,
  items,
  tax,
  shipping,
  coupon,
  lineItems,
}: {
  orderId: string;
  value: number;
  currency: string;
  /** Total quantity across the order (Meta's num_items). */
  items: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  /** Per-line items for GA4 revenue-by-product. */
  lineItems?: GaItem[];
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    analytics.purchase({
      orderId,
      value,
      currency,
      count: items,
      tax,
      shipping,
      coupon,
      items: lineItems,
    });
  }, [orderId, value, currency, items, tax, shipping, coupon, lineItems]);
  return null;
}
