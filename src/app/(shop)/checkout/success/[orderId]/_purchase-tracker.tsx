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
  lineItems,
}: {
  orderId: string;
  value: number;
  currency: string;
  /** Total quantity across the order (Meta's num_items). */
  items: number;
  /** Per-line items for GA4 revenue-by-product. */
  lineItems?: GaItem[];
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    analytics.purchase({ orderId, value, currency, count: items, items: lineItems });
  }, [orderId, value, currency, items, lineItems]);
  return null;
}
