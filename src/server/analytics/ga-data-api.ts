import 'server-only';

import { JWT } from 'google-auth-library';

import { serverEnv } from '@/config/env';

/**
 * Google Analytics 4 — Data API (read side).
 *
 * Pulls aggregated GA metrics back into `/admin/analytics` so operators see the
 * same numbers as analytics.google.com without leaving the app. This is the
 * *read* counterpart to the Measurement Protocol *write* path
 * (`./ga-measurement-protocol`) and is authenticated completely differently: a
 * Google Cloud **service account** (JWT → OAuth token) that has been granted
 * Viewer on the GA property.
 *
 * No-ops (returns a `not-configured` result) unless the property id + service
 * account credentials are set.
 *
 * @see https://developers.google.com/analytics/devguides/reporting/data/v1
 */

const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

export function gaDataApiEnabled(): boolean {
  return Boolean(
    serverEnv.GA_PROPERTY_ID && serverEnv.GA_SA_CLIENT_EMAIL && serverEnv.GA_SA_PRIVATE_KEY,
  );
}

let cachedClient: JWT | null = null;
function jwtClient(): JWT {
  if (cachedClient) return cachedClient;
  cachedClient = new JWT({
    email: serverEnv.GA_SA_CLIENT_EMAIL as string,
    // Env stores the PEM with literal "\n" — restore real newlines.
    key: (serverEnv.GA_SA_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
    scopes: [SCOPE],
  });
  return cachedClient;
}

// ---------- Date ranges ----------

export const GA_RANGES = { '7d': 7, '30d': 30, '90d': 90 } as const;
export type GaRange = keyof typeof GA_RANGES;
export const DEFAULT_GA_RANGE: GaRange = '30d';
export const GA_RANGE_LABELS: Record<GaRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};
export function isGaRange(value: string | undefined): value is GaRange {
  return Boolean(value) && value! in GA_RANGES;
}

// ---------- Types ----------

export type GaKpis = {
  activeUsers: number;
  sessions: number;
  engagedSessions: number;
  pageViews: number;
  conversions: number;
  revenue: number;
};

export type GaRow = { label: string; value: number };
export type GaDailyPoint = { date: string; users: number };

export type GaOverview = {
  kpis: GaKpis;
  daily: GaDailyPoint[];
  events: GaRow[];
  topPages: GaRow[];
  channels: GaRow[];
  countries: GaRow[];
  cities: GaRow[];
  regions: GaRow[];
  devices: GaRow[];
  browsers: GaRow[];
  /** The active country filter, if any (echoed back for the UI). */
  country?: string;
};

export type GaOverviewResult =
  | { ok: true; data: GaOverview }
  | { ok: false; error: string; notConfigured?: boolean };

export type GaOverviewOpts = { country?: string };

// ---------- Minimal GA Data API response shapes ----------

type GaValue = { value?: string };
type GaReportRow = { dimensionValues?: GaValue[]; metricValues?: GaValue[] };
type GaReport = { rows?: GaReportRow[] };
type BatchResponse = { reports?: GaReport[] };

const n = (v: string | undefined) => {
  const parsed = Number(v ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** `YYYYMMDD` (GA date dimension) → `YYYY-MM-DD`. */
const fmtDate = (d: string) =>
  d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;

function rowsToRanked(report: GaReport | undefined): GaRow[] {
  return (report?.rows ?? []).flatMap((r) => {
    const label = r.dimensionValues?.[0]?.value;
    if (!label) return [];
    return [{ label, value: n(r.metricValues?.[0]?.value) }];
  });
}

// ---------- Report ----------

export async function getGaOverview(
  days: number,
  opts: GaOverviewOpts = {},
): Promise<GaOverviewResult> {
  if (!gaDataApiEnabled())
    return { ok: false, error: 'Google Analytics is not connected.', notConfigured: true };

  const propertyId = serverEnv.GA_PROPERTY_ID as string;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

  // When a country is selected, filter EVERY report to it (GA4 has no IP
  // dimension, so location = country/region/city only).
  const geoFilter = opts.country
    ? {
        dimensionFilter: {
          filter: {
            fieldName: 'country',
            stringFilter: { value: opts.country, matchType: 'EXACT' },
          },
        },
      }
    : {};

  const requests = [
    // 0 — headline KPIs
    {
      dateRanges,
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'screenPageViews' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
      ],
      ...geoFilter,
    },
    // 1 — top pages
    {
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 8,
      ...geoFilter,
    },
    // 2 — traffic channels
    {
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 8,
      ...geoFilter,
    },
    // 3 — top countries (the location breakdown / filter source)
    {
      dateRanges,
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
      ...geoFilter,
    },
    // 4 — top cities (respects the country filter when set)
    {
      dateRanges,
      dimensions: [{ name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
      ...geoFilter,
    },
    // 5 — regions / states
    {
      dateRanges,
      dimensions: [{ name: 'region' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
      ...geoFilter,
    },
    // 6 — device category
    {
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 6,
      ...geoFilter,
    },
    // 7 — browser
    {
      dateRanges,
      dimensions: [{ name: 'browser' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 6,
      ...geoFilter,
    },
    // 8 — daily active users (trend chart)
    {
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      ...geoFilter,
    },
    // 9 — top events (ties GA back to the tracking we fire)
    {
      dateRanges,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 12,
      ...geoFilter,
    },
  ];

  try {
    const { token } = await jwtClient().getAccessToken();
    if (!token) return { ok: false, error: 'Service-account authentication failed.' };

    // GA4 caps batchRunReports at 5 report requests — split into chunks and run
    // the batches in parallel, then reassemble the reports in request order.
    const chunks: (typeof requests)[] = [];
    for (let i = 0; i < requests.length; i += 5) chunks.push(requests.slice(i, i + 5));

    const batchResults = await Promise.all(
      chunks.map(async (reqs) => {
        const res = await fetch(`${DATA_API}/properties/${propertyId}:batchRunReports`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: reqs }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw Object.assign(new Error(`GA ${res.status}`), { status: res.status, body });
        }
        return ((await res.json()) as BatchResponse).reports ?? [];
      }),
    );

    const reports = batchResults.flat();
    const kpiValues = reports[0]?.rows?.[0]?.metricValues ?? [];

    return {
      ok: true,
      data: {
        kpis: {
          activeUsers: n(kpiValues[0]?.value),
          sessions: n(kpiValues[1]?.value),
          engagedSessions: n(kpiValues[2]?.value),
          pageViews: n(kpiValues[3]?.value),
          conversions: n(kpiValues[4]?.value),
          revenue: n(kpiValues[5]?.value),
        },
        topPages: rowsToRanked(reports[1]),
        channels: rowsToRanked(reports[2]),
        countries: rowsToRanked(reports[3]),
        cities: rowsToRanked(reports[4]),
        regions: rowsToRanked(reports[5]),
        devices: rowsToRanked(reports[6]),
        browsers: rowsToRanked(reports[7]),
        daily: (reports[8]?.rows ?? []).flatMap((r) => {
          const date = r.dimensionValues?.[0]?.value;
          return date ? [{ date: fmtDate(date), users: n(r.metricValues?.[0]?.value) }] : [];
        }),
        events: rowsToRanked(reports[9]),
        country: opts.country,
      },
    };
  } catch (error) {
    const status = (error as { status?: number }).status;
    const body = (error as { body?: string }).body ?? '';
    let message = error instanceof Error ? error.message : 'Unknown error.';
    if (status === 403) {
      message =
        'Access denied — add the service-account email as a Viewer on the GA property (Admin → Property Access Management).';
    } else if (status === 400 && body.includes('property')) {
      message = 'Invalid GA_PROPERTY_ID — use the numeric property id (Admin → Property Settings).';
    }
    console.warn('[ga-data-api] request failed', status ?? '', message);
    return { ok: false, error: message };
  }
}
