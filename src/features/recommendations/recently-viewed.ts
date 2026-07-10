import type { ProductCardData } from '@/design-system/patterns/product-card';

/**
 * Recently-viewed products, kept in `localStorage` so it works for guests too
 * (the DB model is logged-in only). We store the small card payload directly so
 * the rail renders with no extra fetch.
 */
const KEY = 'elv_recent';
const MAX = 8;

export type RecentItem = ProductCardData;

export function recordRecentlyViewed(item: RecentItem): void {
  if (typeof window === 'undefined' || !item.id) return;
  try {
    const next = [item, ...getRecentlyViewed().filter((p) => p.id !== item.id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage disabled / full — best-effort */
  }
}

export function getRecentlyViewed(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as RecentItem[]) : [];
  } catch {
    return [];
  }
}
