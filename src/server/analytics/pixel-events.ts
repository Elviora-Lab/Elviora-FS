import 'server-only';

import { isProd, publicEnv } from '@/config/env';

import { prisma } from '@/lib/db';

import { capiEnabled } from './meta-capi';

/**
 * First-party "Pixel Events" analytics — the data behind `/admin/pixel`.
 *
 * Meta offers no supported public API to read back raw pixel event volume (that
 * lives only in Events Manager), so this dashboard measures the SAME standard
 * events from our own server-side logs instead. First-party counts are actually
 * MORE reliable than the browser pixel — they aren't lost to ad blockers or
 * ITP — and they map 1:1 onto the events the pixel + Conversions API fire (see
 * `@/lib/analytics/meta-pixel` and `./meta-capi`).
 *
 * Buckets are UTC days (`… AT TIME ZONE 'UTC'`) so the SQL grouping lines up
 * with the UTC date spine we build in JS regardless of the DB session timezone.
 */

// ---------- Date ranges ----------

export const PIXEL_RANGES = { '7d': 7, '30d': 30, '90d': 90 } as const;
export type PixelRange = keyof typeof PIXEL_RANGES;
export const DEFAULT_PIXEL_RANGE: PixelRange = '30d';

export const PIXEL_RANGE_LABELS: Record<PixelRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

export function isPixelRange(value: string | undefined): value is PixelRange {
  return Boolean(value) && value! in PIXEL_RANGES;
}

// ---------- Types ----------

export type PixelSeriesPoint = { date: string; count: number };

export type PixelEventSeries = {
  key: string;
  /** Standard Meta/GA4 event name (e.g. `ViewContent`). */
  label: string;
  total: number;
  /** Same-length window immediately before this one — for the delta badge. */
  previousTotal: number;
  points: PixelSeriesPoint[];
  /** A "good" conversion event (rendered with the success accent). */
  positive: boolean;
};

export type PixelHealth = {
  environment: string;
  isProd: boolean;
  pixel: { id: string | null; configured: boolean; active: boolean };
  ga: { id: string | null; configured: boolean; active: boolean };
  capi: { configured: boolean };
};

/** Coverage map: which destinations each tracked event reaches, and whether we
 *  also measure it first-party (so it appears as a chart above). */
export type CoverageRow = {
  event: string;
  pixel: boolean;
  ga: boolean;
  capi: boolean;
  /** DB table backing the first-party series, or null if pixel/GA-only. */
  firstParty: string | null;
};

export type PixelDashboard = {
  rangeDays: number;
  /** e.g. "vs previous 30 days" — the delta comparison baseline. */
  previousLabel: string;
  health: PixelHealth;
  events: PixelEventSeries[];
  revenue: { total: number; previous: number; currency: string };
  funnel: {
    views: number;
    carts: number;
    purchases: number;
    /** carts / views. */
    cartRate: number;
    /** purchases / views. */
    purchaseRate: number;
    previous: { views: number; carts: number; purchases: number };
  };
  coverage: CoverageRow[];
};

// ---------- Health / config ----------

export function getPixelHealth(): PixelHealth {
  const pixelId = publicEnv.NEXT_PUBLIC_FB_PIXEL_ID || null;
  const gaId = publicEnv.NEXT_PUBLIC_GA_ID || null;
  return {
    environment: publicEnv.NEXT_PUBLIC_ENVIRONMENT,
    isProd,
    pixel: { id: pixelId, configured: Boolean(pixelId), active: isProd && Boolean(pixelId) },
    ga: { id: gaId, configured: Boolean(gaId), active: isProd && Boolean(gaId) },
    capi: { configured: capiEnabled() },
  };
}

/** Every event the app fires, and where it goes. Kept in sync with the
 *  `analytics` facade (`@/lib/analytics`). `firstParty` names the log we can
 *  chart from; null means the event is pixel/GA-only (no server-side record). */
const EVENT_COVERAGE: CoverageRow[] = [
  { event: 'ViewContent', pixel: true, ga: true, capi: false, firstParty: 'product_view_logs' },
  { event: 'ViewCategory', pixel: true, ga: true, capi: false, firstParty: null },
  { event: 'Search', pixel: true, ga: true, capi: false, firstParty: 'search_logs' },
  { event: 'AddToCart', pixel: true, ga: true, capi: true, firstParty: 'cart_event_logs' },
  { event: 'AddToWishlist', pixel: true, ga: true, capi: false, firstParty: null },
  { event: 'InitiateCheckout', pixel: true, ga: true, capi: true, firstParty: null },
  { event: 'AddPaymentInfo', pixel: true, ga: true, capi: false, firstParty: null },
  { event: 'Purchase', pixel: true, ga: true, capi: true, firstParty: 'orders' },
  { event: 'Subscribe', pixel: true, ga: true, capi: false, firstParty: 'newsletter_subscribers' },
  { event: 'CouponApplied', pixel: true, ga: true, capi: false, firstParty: null },
  { event: 'BackInStockNotify', pixel: true, ga: true, capi: false, firstParty: null },
  { event: 'Contact', pixel: true, ga: true, capi: false, firstParty: null },
  { event: 'SkincareAssistant', pixel: true, ga: true, capi: false, firstParty: null },
];

// ---------- Series helpers ----------

type DayRow = { day: string; count: number };
type OrderDayRow = DayRow & { revenue: number };

/** Ordered list of `YYYY-MM-DD` (UTC) days spanning [since, until] inclusive. */
function dateSpine(since: Date, until: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(
    Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate()),
  );
  const end = Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate());
  while (cursor.getTime() <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function buildSeries(
  key: string,
  label: string,
  rows: DayRow[],
  spine: string[],
  previousTotal: number,
  positive = false,
): PixelEventSeries {
  const byDay = new Map(rows.map((r) => [r.day, Number(r.count)]));
  const points = spine.map((date) => ({ date, count: byDay.get(date) ?? 0 }));
  const total = points.reduce((sum, p) => sum + p.count, 0);
  return { key, label, total, previousTotal, points, positive };
}

// ---------- Dashboard ----------

export async function getPixelDashboard(rangeDays: number): Promise<PixelDashboard> {
  const windowMs = rangeDays * 24 * 60 * 60 * 1000;
  const until = new Date();
  const since = new Date(until.getTime() - windowMs);
  // Same-length window immediately before the current one — the delta baseline.
  const prevUntil = since;
  const prevSince = new Date(since.getTime() - windowMs);
  const spine = dateSpine(since, until);

  const [viewRows, cartRows, searchRows, orderRows, subRows, previous] = await Promise.all([
    prisma.$queryRaw<DayRow[]>`
      SELECT to_char(date_trunc('day', viewed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM product_view_logs
      WHERE viewed_at >= ${since} AND viewed_at < ${until}
      GROUP BY 1`,
    prisma.$queryRaw<DayRow[]>`
      SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM cart_event_logs
      WHERE created_at >= ${since} AND created_at < ${until}
      GROUP BY 1`,
    prisma.$queryRaw<DayRow[]>`
      SELECT to_char(date_trunc('day', searched_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM search_logs
      WHERE searched_at >= ${since} AND searched_at < ${until}
      GROUP BY 1`,
    prisma.$queryRaw<OrderDayRow[]>`
      SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count,
             COALESCE(SUM(total_amount), 0)::float AS revenue
      FROM orders
      WHERE created_at >= ${since} AND created_at < ${until}
      GROUP BY 1`,
    prisma.$queryRaw<DayRow[]>`
      SELECT to_char(date_trunc('day', subscribed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM newsletter_subscribers
      WHERE subscribed_at >= ${since} AND subscribed_at < ${until}
      GROUP BY 1`,
    // Previous-period totals only (no daily series needed) — for the deltas.
    previousTotals(prevSince, prevUntil),
  ]);

  const viewContent = buildSeries('view_content', 'ViewContent', viewRows, spine, previous.views);
  const addToCart = buildSeries('add_to_cart', 'AddToCart', cartRows, spine, previous.carts);
  const search = buildSeries('search', 'Search', searchRows, spine, previous.searches);
  const purchase = buildSeries('purchase', 'Purchase', orderRows, spine, previous.purchases, true);
  const subscribe = buildSeries(
    'subscribe',
    'Subscribe',
    subRows,
    spine,
    previous.subscribes,
    true,
  );
  const events: PixelEventSeries[] = [viewContent, addToCart, search, purchase, subscribe];

  const views = viewContent.total;
  const carts = addToCart.total;
  const purchases = purchase.total;
  const revenue = orderRows.reduce((sum, r) => sum + Number(r.revenue ?? 0), 0);

  return {
    rangeDays,
    previousLabel: `vs previous ${rangeDays} days`,
    health: getPixelHealth(),
    events,
    revenue: { total: revenue, previous: previous.revenue, currency: 'PKR' },
    funnel: {
      views,
      carts,
      purchases,
      cartRate: views > 0 ? carts / views : 0,
      purchaseRate: views > 0 ? purchases / views : 0,
      previous: { views: previous.views, carts: previous.carts, purchases: previous.purchases },
    },
    coverage: EVENT_COVERAGE,
  };
}

/** Bare totals for a window — used for the previous-period delta baseline. */
async function previousTotals(sinceDate: Date, untilDate: Date) {
  const [views, carts, searches, orderAgg, subscribes] = await Promise.all([
    prisma.productViewLog.count({ where: { viewedAt: { gte: sinceDate, lt: untilDate } } }),
    prisma.cartEventLog.count({ where: { createdAt: { gte: sinceDate, lt: untilDate } } }),
    prisma.searchLog.count({ where: { searchedAt: { gte: sinceDate, lt: untilDate } } }),
    prisma.order.aggregate({
      _count: { _all: true },
      _sum: { totalAmount: true },
      where: { createdAt: { gte: sinceDate, lt: untilDate } },
    }),
    prisma.newsletterSubscriber.count({
      where: { subscribedAt: { gte: sinceDate, lt: untilDate } },
    }),
  ]);
  return {
    views,
    carts,
    searches,
    purchases: orderAgg._count._all,
    revenue: Number(orderAgg._sum.totalAmount ?? 0),
    subscribes,
  };
}
