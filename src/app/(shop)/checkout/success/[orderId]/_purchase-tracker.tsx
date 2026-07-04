'use client';

import { useEffect, useRef } from 'react';

import { metaPixel } from '@/lib/analytics/meta-pixel';

/**
 * Fires the Meta Pixel Purchase event once when the order-confirmation page
 * loads. Lives in a client component because the success page is a Server
 * Component. One-shot per mount so a refresh doesn't re-fire it in the same view.
 */
export function PurchaseTracker({
  orderId,
  value,
  currency,
  items,
}: {
  orderId: string;
  value: number;
  currency: string;
  items: number;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    metaPixel.purchase({ orderId, value, currency, items });
  }, [orderId, value, currency, items]);
  return null;
}
