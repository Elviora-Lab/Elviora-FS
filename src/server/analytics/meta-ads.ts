import 'server-only';

import { serverEnv } from '@/config/env';

/**
 * Meta Marketing API — read-only ad performance (Insights).
 *
 * Pulls spend, ROAS, revenue and delivery metrics for the configured ad
 * account so the admin can see campaign performance without leaving the app.
 * The conversions that feed ROAS here are the same Purchase events the pixel +
 * Conversions API report.
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
};

export type CampaignInsight = AdsInsight & {
  campaignId: string;
  campaignName: string;
};

export type AdsOverview = {
  currency: string;
  accountName: string;
  account: AdsInsight;
  campaigns: CampaignInsight[];
};

export type AdsOverviewResult = { ok: true; data: AdsOverview } | { ok: false; error: string };

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
};

// Meta reports a purchase under several action types depending on channel and
// attribution. Prefer the deduplicated omni_ metric, then the pixel-specific
// one, then the generic — pick ONE (never sum, or the same purchase is counted
// two or three times).
const PURCHASE_ACTION_PRIORITY = [
  'omni_purchase',
  'offsite_conversion.fb_pixel_purchase',
  'purchase',
] as const;

function pickPurchaseValue(rows: ActionRow[] | undefined): number {
  if (!rows?.length) return 0;
  for (const type of PURCHASE_ACTION_PRIORITY) {
    const row = rows.find((r) => r.action_type === type);
    if (row) return Number(row.value) || 0;
  }
  return 0;
}

function num(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toInsight(row: InsightRow | undefined): AdsInsight {
  const spend = num(row?.spend);
  const revenue = pickPurchaseValue(row?.action_values);
  const purchases = pickPurchaseValue(row?.actions);
  const attributedRoas = pickPurchaseValue(row?.purchase_roas);
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
  };
}

const INSIGHT_FIELDS =
  'spend,impressions,reach,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas';

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

/**
 * Fetch the account summary plus per-campaign breakdown for a date range.
 * Never throws — Graph/permission errors come back as `{ ok: false, error }`
 * so the dashboard can render a message instead of crashing.
 */
export async function getAdsOverview(datePreset: AdDatePreset): Promise<AdsOverviewResult> {
  if (!adsInsightsEnabled()) {
    return { ok: false, error: 'Meta Ads is not configured.' };
  }

  const act = accountPath();

  try {
    const [meta, accountInsights, campaignInsights] = await Promise.all([
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
        limit: '100',
      }),
    ]);

    const campaigns: CampaignInsight[] = (campaignInsights.data ?? [])
      .map((row) => ({
        ...toInsight(row),
        campaignId: row.campaign_id ?? '',
        campaignName: row.campaign_name ?? 'Untitled campaign',
      }))
      .sort((a, b) => b.spend - a.spend);

    return {
      ok: true,
      data: {
        currency: meta.currency ?? 'USD',
        accountName: meta.name ?? 'Ad account',
        account: toInsight(accountInsights.data?.[0]),
        campaigns,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load ad insights.',
    };
  }
}
