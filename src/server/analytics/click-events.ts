import 'server-only';

import { clickstreamEnabled } from '@/lib/analytics/clickstream';
import { prisma } from '@/lib/db';

/**
 * First-party clickstream analytics — the data behind `/admin/clicks`.
 *
 * Reads back the `click_event_logs` the browser's delegated listener records
 * (see `@/components/analytics/click-tracker`). Buckets are UTC days so the SQL
 * grouping lines up with the JS date spine regardless of DB session timezone —
 * same convention as `./pixel-events`.
 */

// ---------- Ranges ----------

export const CLICK_RANGES = { '7d': 7, '30d': 30, '90d': 90 } as const;
export type ClickRange = keyof typeof CLICK_RANGES;
export const DEFAULT_CLICK_RANGE: ClickRange = '30d';

export const CLICK_RANGE_LABELS: Record<ClickRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

export function isClickRange(value: string | undefined): value is ClickRange {
  return Boolean(value) && value! in CLICK_RANGES;
}

// ---------- Types ----------

export type TrendPoint = { date: string; count: number };
export type TypeRow = { type: string; count: number };
export type TargetRow = { label: string; type: string; count: number };
export type ProductRow = { id: string; label: string; count: number };
export type PageRow = { path: string; count: number };

export type ClickDashboard = {
  rangeDays: number;
  previousLabel: string;
  /** True when capture is active (production only, like the pixel). */
  captureEnabled: boolean;
  totalClicks: number;
  previousClicks: number;
  uniqueVisitors: number;
  trend: TrendPoint[];
  byType: TypeRow[];
  topTargets: TargetRow[];
  topProducts: ProductRow[];
  topPages: PageRow[];
};

// ---------- Helpers ----------

type DayRow = { day: string; count: number };

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

// ---------- Dashboard ----------

export async function getClickDashboard(rangeDays: number): Promise<ClickDashboard> {
  const windowMs = rangeDays * 24 * 60 * 60 * 1000;
  const until = new Date();
  const since = new Date(until.getTime() - windowMs);
  const prevUntil = since;
  const prevSince = new Date(since.getTime() - windowMs);
  const spine = dateSpine(since, until);

  const [trendRows, byType, topTargets, topProducts, topPages, uniqueRows, previousClicks] =
    await Promise.all([
      prisma.$queryRaw<DayRow[]>`
        SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count
        FROM click_event_logs
        WHERE created_at >= ${since} AND created_at < ${until}
          AND page_path NOT LIKE '/admin%'
        GROUP BY 1`,
      prisma.$queryRaw<TypeRow[]>`
        SELECT target_type AS type, COUNT(*)::int AS count
        FROM click_event_logs
        WHERE created_at >= ${since} AND created_at < ${until}
          AND page_path NOT LIKE '/admin%'
        GROUP BY 1
        ORDER BY count DESC`,
      prisma.$queryRaw<TargetRow[]>`
        SELECT COALESCE(NULLIF(label, ''), target_id, href, target_type) AS label,
               target_type AS type,
               COUNT(*)::int AS count
        FROM click_event_logs
        WHERE created_at >= ${since} AND created_at < ${until}
          AND page_path NOT LIKE '/admin%'
        GROUP BY 1, 2
        ORDER BY count DESC
        LIMIT 15`,
      prisma.$queryRaw<ProductRow[]>`
        SELECT target_id AS id,
               COALESCE(NULLIF(label, ''), target_id) AS label,
               COUNT(*)::int AS count
        FROM click_event_logs
        WHERE created_at >= ${since} AND created_at < ${until}
          AND page_path NOT LIKE '/admin%'
          AND target_type = 'product' AND target_id IS NOT NULL
        GROUP BY 1, 2
        ORDER BY count DESC
        LIMIT 10`,
      prisma.$queryRaw<PageRow[]>`
        SELECT page_path AS path, COUNT(*)::int AS count
        FROM click_event_logs
        WHERE created_at >= ${since} AND created_at < ${until}
          AND page_path NOT LIKE '/admin%'
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 10`,
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT COALESCE(user_id::text, guest_id))::int AS count
        FROM click_event_logs
        WHERE created_at >= ${since} AND created_at < ${until}
          AND page_path NOT LIKE '/admin%'`,
      prisma.clickEventLog.count({
        where: {
          createdAt: { gte: prevSince, lt: prevUntil },
          NOT: { pagePath: { startsWith: '/admin' } },
        },
      }),
    ]);

  const byDay = new Map(trendRows.map((r) => [r.day, Number(r.count)]));
  const trend = spine.map((date) => ({ date, count: byDay.get(date) ?? 0 }));
  const totalClicks = trend.reduce((sum, p) => sum + p.count, 0);

  return {
    rangeDays,
    previousLabel: `vs previous ${rangeDays} days`,
    captureEnabled: clickstreamEnabled,
    totalClicks,
    previousClicks,
    uniqueVisitors: Number(uniqueRows[0]?.count ?? 0),
    trend,
    byType: byType.map((r) => ({ type: r.type, count: Number(r.count) })),
    topTargets: topTargets.map((r) => ({ ...r, count: Number(r.count) })),
    topProducts: topProducts.map((r) => ({ ...r, count: Number(r.count) })),
    topPages: topPages.map((r) => ({ path: r.path, count: Number(r.count) })),
  };
}
