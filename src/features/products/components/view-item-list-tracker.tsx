'use client';

import { useEffect, useRef } from 'react';

import { analytics } from '@/lib/analytics';

import type { ProductCardData } from '@/design-system/patterns/product-card';

/**
 * Fires GA4 `view_item_list` for a server-rendered product grid (which can't run
 * an effect itself). Reports once per distinct product set, so a filter/sort
 * that swaps the products re-reports the new list.
 */
export function ViewItemListTracker({
  products,
  listId,
  listName,
}: {
  products: ProductCardData[];
  listId?: string;
  listName?: string;
}) {
  const tracked = useRef('');

  useEffect(() => {
    if (products.length === 0) return;
    const key = products.map((p) => p.id).join(',');
    if (tracked.current === key) return;
    tracked.current = key;
    analytics.viewItemList({
      listId,
      listName,
      items: products.slice(0, 50).map((p, i) => ({
        item_id: p.id,
        item_name: p.name,
        item_brand: p.brandLine,
        item_list_id: listId,
        item_list_name: listName,
        price: p.price,
        index: i,
      })),
    });
  }, [products, listId, listName]);

  return null;
}
