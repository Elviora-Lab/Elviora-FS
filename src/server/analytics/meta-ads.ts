import 'server-only';

import { serverEnv } from '@/config/env';

/**
 * Meta Marketing API — read-only ad performance (Insights).
 *
 * Pulls spend, ROAS, revenue, funnel drop-off and delivery metrics for the
 * configured ad account so the admin can see campaign performance without
 * leaving the app. The conversions that feed ROAS here are the same Purchase
 * events the pixel + Conversions API report.
 *
 * Read-only: needs a System User token with `ads_read` (no write scope). Stays
 * completely inert unless `META_ADS_ACCESS_TOKEN` and `META_ADS_ACCOUNT_ID`
 * are configured — the dashboard renders a setup card instead.
 */

const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function adsInsightsEnabled(): boolean {
  return Boolean(serverEnv.META_ADS_ACCESS_TOKEN && serverEnv.META_ADS_ACCOUNT_ID);
}

/** `act_` prefix is what the Graph API expects; tolerate the id given either way. */
function accountPath(): string {
  const id = (serverEnv.META_ADS_ACCOUNT_ID ?? '').trim();
  return id.startsWith('act_') ? id : `act_${id}`;
}

export const AD_DATE_PRESETS = [
  'today',
  'yesterday',
  'last_7d',
  'last_14d',
  'last_30d',
  'last_90d',
  'this_month',
  'last_month',
  'maximum',
] as const;

export type AdDatePreset = (typeof AD_DATE_PRESETS)[number];

export const AD_DATE_PRESET_LABELS: Record<AdDatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7d: 'Last 7 days',
  last_14d: 'Last 14 days',
  last_30d: 'Last 30 days',
  last_90d: 'Last 90 days',
  this_month: 'This month',
  last_month: 'Last month',
  maximum: 'All time',
};

export function isAdDatePreset(value: string | undefined): value is AdDatePreset {
  return Boolean(value) && (AD_DATE_PRESETS as readonly string[]).includes(value as string);
}

// Fixed-length day windows we can build a fair "previous period" for. Presets
// like this_month / maximum have no clean equivalent prior window, so their
// tiles simply show no delta.
const PRESET_DAYS: Partial<Record<AdDatePreset, number>> = {
  today: 1,
  yesterday: 1,
  last_7d: 7,
  last_14d: 14,
  last_30d: 30,
  last_90d: 90,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdsFunnel = {
  /** Outbound/link clicks to the site. */
  linkClicks: number;
  landingPageViews: number;
  viewContent: number;
  addToCart: number;
  checkout: number;
  purchases: number;
};

export type AdsInsight = {
  spend: number;
  revenue: number;
  /** Return on ad spend — Meta's attributed number when present, else revenue/spend. */
  roas: number;
  purchases: number;
  /** Cost per purchase (spend / purchases). */
  costPerPurchase: number;
  impressions: number;
  reach: number;
  clicks: number;
  /** Click-through rate, already a percentage. */
  ctr: number;
  /** Cost per click. */
  cpc: number;
  /** Cost per 1,000 impressions. */
  cpm: number;
  funnel: AdsFunnel;
};

export type CampaignInsight = AdsInsight & {
  campaignId: string;
  campaignName: string;
  /** Raw Meta effective_status (ACTIVE, PAUSED, ARCHIVED…). '' if unknown. */
  status: string;
  isActive: boolean;
  objective: string;
};

export type BreakdownRow = {
  label: string;
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
};

export type AdsBreakdowns = {
  placement: BreakdownRow[];
  demographic: BreakdownRow[];
  device: BreakdownRow[];
};

export type TopAd = {
  adId: string;
  adName: string;
  campaignName: string;
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  thumbnailUrl: string | null;
};

export type DailyPoint = {
  date: string;
  spend: number;
  revenue: number;
  roas: number;
};

export type AdsOverview = {
  currency: string;
  accountName: string;
  account: AdsInsight;
  /** Prior equal-length window for delta indicators; null when not applicable. */
  previous: AdsInsight | null;
  previousLabel: string | null;
  campaigns: CampaignInsight[];
  breakdowns: AdsBreakdowns;
  topAds: TopAd[];
  /** Per-day spend/revenue/ROAS for the trend chart. */
  daily: DailyPoint[];
};

export type AdsOverviewResult = { ok: true; data: AdsOverview } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Action-type parsing
// ---------------------------------------------------------------------------

type ActionRow = { action_type: string; value: string };

type InsightRow = {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: ActionRow[];
  action_values?: ActionRow[];
  purchase_roas?: ActionRow[];
  campaign_id?: string;
  campaign_name?: string;
  ad_id?: string;
  ad_name?: string;
  publisher_platform?: string;
  age?: string;
  gender?: string;
  impression_device?: string;
  date_start?: string;
};

// Meta reports each conversion under several action types depending on channel
// and attribution. Prefer the deduplicated omni_ metric, then the pixel one,
// then the generic — pick ONE (never sum, or the same event is double-counted).
const PURCHASE_TYPES = [
  'omni_purchase',
  'offsite_conversion.fb_pixel_purchase',
  'purchase',
] as const;
const VIEW_CONTENT_TYPES = [
  'omni_view_content',
  'offsite_conversion.fb_pixel_view_content',
  'view_content',
] as const;
const ADD_TO_CART_TYPES = [
  'omni_add_to_cart',
  'offsite_conversion.fb_pixel_add_to_cart',
  'add_to_cart',
] as const;
const CHECKOUT_TYPES = [
  'omni_initiated_checkout',
  'offsite_conversion.fb_pixel_initiate_checkout',
  'initiate_checkout',
] as const;
const LPV_TYPES = ['landing_page_view'] as const;
const LINK_CLICK_TYPES = ['link_click'] as const;

function pick(rows: ActionRow[] | undefined, priority: readonly string[]): number {
  if (!rows?.length) return 0;
  for (const type of priority) {
    const row = rows.find((r) => r.action_type === type);
    if (row) return Number(row.value) || 0;
  }
  return 0;
}

function num(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toFunnel(row: InsightRow | undefined): AdsFunnel {
  return {
    linkClicks: pick(row?.actions, LINK_CLICK_TYPES),
    landingPageViews: pick(row?.actions, LPV_TYPES),
    viewContent: pick(row?.actions, VIEW_CONTENT_TYPES),
    addToCart: pick(row?.actions, ADD_TO_CART_TYPES),
    checkout: pick(row?.actions, CHECKOUT_TYPES),
    purchases: pick(row?.actions, PURCHASE_TYPES),
  };
}

function toInsight(row: InsightRow | undefined): AdsInsight {
  const spend = num(row?.spend);
  const revenue = pick(row?.action_values, PURCHASE_TYPES);
  const purchases = pick(row?.actions, PURCHASE_TYPES);
  const attributedRoas = pick(row?.purchase_roas, PURCHASE_TYPES);
  return {
    spend,
    revenue,
    roas: attributedRoas > 0 ? attributedRoas : spend > 0 ? revenue / spend : 0,
    purchases,
    costPerPurchase: purchases > 0 ? spend / purchases : 0,
    impressions: num(row?.impressions),
    reach: num(row?.reach),
    clicks: num(row?.clicks),
    ctr: num(row?.ctr),
    cpc: num(row?.cpc),
    cpm: num(row?.cpm),
    funnel: toFunnel(row),
  };
}

function toBreakdownRow(row: InsightRow, label: string): BreakdownRow {
  const i = toInsight(row);
  return { label, spend: i.spend, revenue: i.revenue, roas: i.roas, purchases: i.purchases };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const INSIGHT_FIELDS =
  'spend,impressions,reach,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas';
const BREAKDOWN_FIELDS = 'spend,actions,action_values,purchase_roas';

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = serverEnv.META_ADS_ACCESS_TOKEN as string;
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set('access_token', token);

  const res = await fetch(url, { cache: 'no-store' });
  const body = (await res.json().catch(() => null)) as
    | { error?: { message?: string } }
    | (T & { error?: undefined })
    | null;

  if (!res.ok || (body && 'error' in body && body.error)) {
    const message = body?.error?.message ?? `Graph API returned ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

/** Supplementary calls degrade gracefully — a failure returns the fallback. */
function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch(() => fallback);
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The equal-length window immediately before the selected preset, or null. */
function previousWindow(
  preset: AdDatePreset,
): { since: string; until: string; label: string } | null {
  const days = PRESET_DAYS[preset];
  if (!days) return null;
  const now = new Date();
  const until = new Date(now);
  until.setUTCDate(until.getUTCDate() - days);
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 2 * days + 1);
  return {
    since: fmtDate(since),
    until: fmtDate(until),
    label: days === 1 ? 'vs prior day' : `vs prior ${days} days`,
  };
}

/**
 * Explicit {since, until} dates for a preset, for querying the store DB so the
 * order window lines up with Meta's. Approximate (Meta uses the ad-account
 * timezone; we use the server's) — fine for a reconciliation view.
 */
export function presetToDateRange(preset: AdDatePreset): { since: Date; until: Date } {
  const until = new Date();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  switch (preset) {
    case 'today':
      break;
    case 'yesterday':
      since.setUTCDate(since.getUTCDate() - 1);
      until.setUTCDate(until.getUTCDate() - 1);
      until.setUTCHours(23, 59, 59, 999);
      break;
    case 'last_7d':
      since.setUTCDate(since.getUTCDate() - 7);
      break;
    case 'last_14d':
      since.setUTCDate(since.getUTCDate() - 14);
      break;
    case 'last_30d':
      since.setUTCDate(since.getUTCDate() - 30);
      break;
    case 'last_90d':
      since.setUTCDate(since.getUTCDate() - 90);
      break;
    case 'this_month':
      since.setUTCDate(1);
      break;
    case 'last_month':
      since.setUTCDate(1);
      since.setUTCMonth(since.getUTCMonth() - 1);
      until.setUTCDate(0); // last day of previous month
      until.setUTCHours(23, 59, 59, 999);
      break;
    case 'maximum':
      since.setUTCFullYear(2000, 0, 1);
      break;
  }
  return { since, until };
}

async function fetchBreakdown(
  act: string,
  datePreset: AdDatePreset,
  breakdowns: string,
  toLabel: (row: InsightRow) => string,
): Promise<BreakdownRow[]> {
  const res = await graphGet<{ data?: InsightRow[] }>(`${act}/insights`, {
    fields: BREAKDOWN_FIELDS,
    date_preset: datePreset,
    level: 'account',
    breakdowns,
    limit: '50',
  });
  return (res.data ?? [])
    .map((row) => toBreakdownRow(row, toLabel(row)))
    .filter((r) => r.spend > 0)
    .sort((a, b) => b.spend - a.spend);
}

const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Fetch thumbnails for the given ad ids in one batched call. */
async function fetchAdThumbnails(ids: string[]): Promise<Record<string, string | null>> {
  if (!ids.length) return {};
  const res = await graphGet<Record<string, { creative?: { thumbnail_url?: string } }>>('', {
    ids: ids.join(','),
    fields: 'creative{thumbnail_url}',
  });
  const map: Record<string, string | null> = {};
  for (const id of ids) map[id] = res?.[id]?.creative?.thumbnail_url ?? null;
  return map;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Fetch the account summary, per-campaign breakdown (with live status), the
 * prior-period comparison, placement/demographic/device breakdowns and the top
 * ads for a date range. Never throws: the two core insights calls failing
 * returns `{ ok: false, error }`; every richer section degrades to empty on its
 * own error so one missing feature can't blank the whole page.
 */
export async function getAdsOverview(datePreset: AdDatePreset): Promise<AdsOverviewResult> {
  if (!adsInsightsEnabled()) {
    return { ok: false, error: 'Meta Ads is not configured.' };
  }

  const act = accountPath();
  const prev = previousWindow(datePreset);

  try {
    const [
      meta,
      accountInsights,
      campaignInsights,
      previousInsights,
      campaignMeta,
      placement,
      demographic,
      device,
      topAdRows,
      dailyRows,
    ] = await Promise.all([
      // --- Core (failure ⇒ error card) ---
      graphGet<{ name?: string; currency?: string }>(act, { fields: 'name,currency' }),
      graphGet<{ data?: InsightRow[] }>(`${act}/insights`, {
        fields: INSIGHT_FIELDS,
        date_preset: datePreset,
        level: 'account',
      }),
      graphGet<{ data?: InsightRow[] }>(`${act}/insights`, {
        fields: `${INSIGHT_FIELDS},campaign_id,campaign_name`,
        date_preset: datePreset,
        level: 'campaign',
        limit: '200',
      }),
      // --- Supplementary (failure ⇒ graceful empty) ---
      prev
        ? safe(
            graphGet<{ data?: InsightRow[] }>(`${act}/insights`, {
              fields: INSIGHT_FIELDS,
              time_range: JSON.stringify({ since: prev.since, until: prev.until }),
              level: 'account',
            }),
            { data: [] },
          )
        : Promise.resolve<{ data?: InsightRow[] }>({ data: [] }),
      safe(
        graphGet<{ data?: { id: string; effective_status?: string; objective?: string }[] }>(
          `${act}/campaigns`,
          { fields: 'id,effective_status,objective', limit: '500' },
        ),
        { data: [] },
      ),
      safe(
        fetchBreakdown(act, datePreset, 'publisher_platform', (r) =>
          titleCase(r.publisher_platform ?? 'Unknown'),
        ),
        [],
      ),
      safe(
        fetchBreakdown(
          act,
          datePreset,
          'age,gender',
          (r) => `${r.age ?? '?'} · ${titleCase(r.gender ?? 'unknown')}`,
        ),
        [],
      ),
      safe(
        fetchBreakdown(act, datePreset, 'impression_device', (r) =>
          titleCase(r.impression_device ?? 'Unknown'),
        ),
        [],
      ),
      safe(
        graphGet<{ data?: InsightRow[] }>(`${act}/insights`, {
          fields: 'ad_id,ad_name,campaign_name,spend,actions,action_values,purchase_roas',
          date_preset: datePreset,
          level: 'ad',
          sort: 'spend_descending',
          limit: '8',
        }),
        { data: [] },
      ),
      safe(
        graphGet<{ data?: InsightRow[] }>(`${act}/insights`, {
          fields: 'spend,action_values,purchase_roas',
          date_preset: datePreset,
          level: 'account',
          time_increment: '1',
          limit: '200',
        }),
        { data: [] },
      ),
    ]);

    // Join campaign status onto the insight rows.
    const statusMap = new Map((campaignMeta.data ?? []).map((c) => [c.id, c] as const));
    const campaigns: CampaignInsight[] = (campaignInsights.data ?? [])
      .map((row) => {
        const cid = row.campaign_id ?? '';
        const meta = statusMap.get(cid);
        const status = meta?.effective_status ?? '';
        return {
          ...toInsight(row),
          campaignId: cid,
          campaignName: row.campaign_name ?? 'Untitled campaign',
          status,
          isActive: status === 'ACTIVE',
          objective: meta?.objective ?? '',
        };
      })
      .sort((a, b) => b.spend - a.spend);

    // Top ads + thumbnails (second, dependent call).
    const topAdInsights = (topAdRows.data ?? []).filter((r) => r.ad_id);
    const thumbnails = await safe(
      fetchAdThumbnails(topAdInsights.map((r) => r.ad_id as string)),
      {} as Record<string, string | null>,
    );
    const topAds: TopAd[] = topAdInsights.map((row) => {
      const i = toInsight(row);
      return {
        adId: row.ad_id as string,
        adName: row.ad_name ?? 'Untitled ad',
        campaignName: row.campaign_name ?? '',
        spend: i.spend,
        revenue: i.revenue,
        roas: i.roas,
        purchases: i.purchases,
        thumbnailUrl: thumbnails[row.ad_id as string] ?? null,
      };
    });

    const previousInsight =
      prev && previousInsights.data?.length ? toInsight(previousInsights.data[0]) : null;

    const daily: DailyPoint[] = (dailyRows.data ?? []).map((row) => {
      const i = toInsight(row);
      return { date: row.date_start ?? '', spend: i.spend, revenue: i.revenue, roas: i.roas };
    });

    return {
      ok: true,
      data: {
        currency: meta.currency ?? 'USD',
        accountName: meta.name ?? 'Ad account',
        account: toInsight(accountInsights.data?.[0]),
        previous: previousInsight,
        previousLabel: prev?.label ?? null,
        campaigns,
        breakdowns: { placement, demographic, device },
        topAds,
        daily,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load ad insights.',
    };
  }
}
