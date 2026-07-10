'use client';

import { useEffect, useState } from 'react';

import { ProductCard } from '@/design-system/patterns/product-card';

import { getRecentlyViewed, type RecentItem } from '../recently-viewed';

/**
 * "Recently viewed" rail from localStorage. Renders nothing until the client has
 * hydrated (avoids SSR mismatch) or when there's nothing to show. `excludeId`
 * drops the product currently being viewed.
 */
export function RecentlyViewed({
  excludeId,
  limit = 4,
  heading = 'Recently viewed',
}: {
  excludeId?: string;
  limit?: number;
  heading?: string;
}) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(
      getRecentlyViewed()
        .filter((p) => p.id !== excludeId)
        .slice(0, limit),
    );
  }, [excludeId, limit]);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="editorial-heading text-display-sm">{heading}</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            index={i}
            listId="recently_viewed"
            listName="Recently viewed"
          />
        ))}
      </div>
    </section>
  );
}
