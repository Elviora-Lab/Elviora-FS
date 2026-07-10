'use client';

import { useEffect } from 'react';

import { type RecentItem, recordRecentlyViewed } from '../recently-viewed';

/** Records the current product into the recently-viewed list (PDP only). */
export function RecentlyViewedTracker({ item }: { item: RecentItem }) {
  useEffect(() => {
    recordRecentlyViewed(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);
  return null;
}
