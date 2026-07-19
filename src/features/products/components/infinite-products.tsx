'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { type ProductCardData } from '@/design-system/patterns/product-card';
import { EmptyState } from '@/design-system/primitives/empty-state';
import { Button } from '@/components/ui/button';

import { ProductCardConnected } from './product-card-connected';
import { ViewItemListTracker } from './view-item-list-tracker';

/**
 * Infinite-scroll product grid.
 *
 * The first page is passed in from the server, and because client components
 * still SSR those cards land in the initial HTML — LCP and crawlability match
 * the old server-rendered grid. Subsequent pages come from `/api/v1/products`,
 * which already returns items in `ProductCardData` shape.
 *
 * Batches are kept separate rather than flattened into one array so each can
 * mount its own `ViewItemListTracker`: that component reports once per distinct
 * product set and caps at 50 items, so feeding it an ever-growing list would
 * re-report everything on each append and silently drop the tail.
 *
 * The "Load more" button is always rendered while more exist — the observer
 * merely clicks it early. That keeps the grid usable when IntersectionObserver
 * never fires (reduced-motion setups, odd viewports) and gives keyboard users a
 * real control instead of a scroll trap.
 *
 * Remount this component when filters change (pass a `key` derived from the
 * query) so it doesn't append new results onto a stale list.
 */
export function InfiniteProducts({
  initialProducts,
  total,
  pageSize,
  query,
  listId,
  listName,
}: {
  initialProducts: ProductCardData[];
  total: number;
  pageSize: number;
  /** Active filters, forwarded verbatim to /api/v1/products. */
  query: Record<string, string | undefined>;
  listId?: string;
  listName?: string;
}) {
  const [batches, setBatches] = useState<ProductCardData[][]>([initialProducts]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Guards against the observer firing again mid-request (it re-triggers on
  // every layout shift while the sentinel stays in view).
  const inFlight = useRef(false);

  const loaded = batches.reduce((n, b) => n + b.length, 0);
  const hasMore = loaded < total;

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasMore) return;
    inFlight.current = true;
    setLoading(true);
    setError(false);
    try {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value) sp.set(key, value);
      }
      sp.set('page', String(page + 1));
      sp.set('pageSize', String(pageSize));

      const res = await fetch(`/api/v1/products?${sp.toString()}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      const items: ProductCardData[] = json?.data?.items ?? [];
      // An empty page with pages still nominally remaining would otherwise
      // spin forever — treat it as the end of the list.
      if (items.length === 0) {
        setPage(Math.ceil(total / pageSize));
      } else {
        setBatches((prev) => [...prev, items]);
        setPage((p) => p + 1);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [hasMore, page, pageSize, query, total]);

  useEffect(() => {
    // Don't auto-load after a failure — the user retries explicitly, otherwise
    // a persistent error would hammer the API on every scroll tick.
    if (!hasMore || error) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      // Start fetching before the sentinel is actually on screen so the next
      // rows are usually ready by the time the user reaches them.
      { rootMargin: '600px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, hasMore, error]);

  if (total === 0) {
    return (
      <EmptyState
        title="Nothing to show — yet"
        description="Try adjusting your filters or browse our latest editorial picks."
      />
    );
  }

  let offset = 0;
  const trackers = batches.map((batch, i) => {
    const at = offset;
    offset += batch.length;
    return (
      <ViewItemListTracker
        key={`batch-${i}`}
        products={batch}
        listId={listId}
        listName={listName}
        indexOffset={at}
      />
    );
  });

  return (
    <>
      {trackers}
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {batches.flat().map((p, i) => (
          <ProductCardConnected
            key={p.id}
            product={p}
            priority={i < 4}
            listId={listId}
            listName={listName}
            index={i}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        <p aria-live="polite" className="text-xs text-muted-foreground">
          Showing {loaded} of {total} products
        </p>

        {error ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">Couldn’t load more products.</p>
            <Button variant="outline" size="sm" onClick={() => void loadMore()}>
              Try again
            </Button>
          </div>
        ) : hasMore ? (
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void loadMore()}>
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        ) : null}

        {/* Observed sentinel — sits below the button so it enters view last. */}
        <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      </div>
    </>
  );
}
