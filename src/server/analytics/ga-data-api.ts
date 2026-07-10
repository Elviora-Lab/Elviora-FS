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
  topPages: GaRow[];
  channels: GaRow[];
  daily: GaDailyPoint[];
};

export type GaOverviewResult =
  | { ok: true; data: GaOverview }
  | { ok: false; error: string; notConfigured?: boolean };

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

export async function getGaOverview(days: number): Promise<GaOverviewResult> {
  if (!gaDataApiEnabled())
    return { ok: false, error: 'Google Analytics is not connected.', notConfigured: true };

  const propertyId = serverEnv.GA_PROPERTY_ID as string;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

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
    },
    // 1 — top pages
    {
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 8,
    },
    // 2 — traffic channels
    {
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 8,
    },
    // 3 — daily active users (trend)
    {
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    },
  ];

  try {
    const { token } = await jwtClient().getAccessToken();
    if (!token) return { ok: false, error: 'Service-account authentication failed.' };

    const res = await fetch(`${DATA_API}/properties/${propertyId}:batchRunReports`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let message = `GA Data API error (${res.status}).`;
      if (res.status === 403) {
        message =
          'Access denied — add the service-account email as a Viewer on the GA property (Admin → Property Access Management).';
      } else if (res.status === 400 && body.includes('property')) {
        message =
          'Invalid GA_PROPERTY_ID — use the numeric property id (Admin → Property Settings).';
      }
      console.warn('[ga-data-api]', res.status, body.slice(0, 300));
      return { ok: false, error: message };
    }

    const json = (await res.json()) as BatchResponse;
    const reports = json.reports ?? [];
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
        daily: (reports[3]?.rows ?? []).flatMap((r) => {
          const date = r.dimensionValues?.[0]?.value;
          if (!date) return [];
          return [{ date: fmtDate(date), users: n(r.metricValues?.[0]?.value) }];
        }),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    console.warn('[ga-data-api] request failed', message);
    return { ok: false, error: message };
  }
}
