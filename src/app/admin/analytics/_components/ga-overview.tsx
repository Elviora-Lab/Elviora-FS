import { ExternalLink } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { type GaRow, getGaOverview } from '@/server/analytics/ga-data-api';

const WINDOW_DAYS = 30;

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');
const fmtMoney = (n: number) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return fmtInt(n);
  }
};
const pct = (num: number, denom: number) =>
  denom > 0 ? `${((num / denom) * 100).toFixed(1)}%` : '—';

function RankedList({
  title,
  description,
  rows,
  unit,
  formatLabel,
}: {
  title: string;
  description: string;
  rows: GaRow[];
  unit: string;
  formatLabel?: (label: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            No data in the last {WINDOW_DAYS} days.
          </p>
        ) : (
          <ol className="divide-y divide-border/60">
            {rows.map((r, i) => (
              <li key={`${r.label}-${i}`} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">
                  {formatLabel ? formatLabel(r.label) : r.label}
                </span>
                <span className="font-medium tabular-nums">
                  {fmtInt(r.value)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function GaSectionShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="editorial-heading text-display-sm">Google Analytics</h2>
          <p className="text-sm text-muted-foreground">Live from GA4 — last {WINDOW_DAYS} days.</p>
        </div>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
        >
          Open GA4 <ExternalLink className="size-3.5" />
        </a>
      </div>
      {children}
    </section>
  );
}

export async function GaOverview() {
  const result = await getGaOverview(WINDOW_DAYS);

  if (!result.ok) {
    return (
      <GaSectionShell>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {result.notConfigured ? 'Connect Google Analytics' : 'Couldn’t load Google Analytics'}
            </CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
          {result.notConfigured ? (
            <CardContent className="text-sm text-muted-foreground">
              <p className="mb-2">To surface GA metrics here, add a read-only service account:</p>
              <ol className="ml-4 list-decimal space-y-1">
                <li>
                  Google Cloud → create a service account + JSON key; enable the Analytics Data API.
                </li>
                <li>
                  GA4 → Admin → Property Access Management → add the service-account email as
                  Viewer.
                </li>
                <li>
                  Set <code className="rounded bg-muted px-1">GA_PROPERTY_ID</code>,{' '}
                  <code className="rounded bg-muted px-1">GA_SA_CLIENT_EMAIL</code>,{' '}
                  <code className="rounded bg-muted px-1">GA_SA_PRIVATE_KEY</code> and redeploy.
                </li>
              </ol>
            </CardContent>
          ) : null}
        </Card>
      </GaSectionShell>
    );
  }

  const { kpis, topPages, channels } = result.data;
  const tiles = [
    { label: 'Active users', value: fmtInt(kpis.activeUsers) },
    { label: 'Sessions', value: fmtInt(kpis.sessions) },
    {
      label: 'Engaged sessions',
      value: fmtInt(kpis.engagedSessions),
      sub: `${pct(kpis.engagedSessions, kpis.sessions)} of sessions`,
    },
    { label: 'Page views', value: fmtInt(kpis.pageViews) },
    { label: 'Key events', value: fmtInt(kpis.conversions) },
    { label: 'Revenue', value: fmtMoney(kpis.revenue) },
  ];

  return (
    <GaSectionShell>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader>
              <CardDescription>{t.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{t.value}</CardTitle>
              {t.sub ? <p className="text-xs text-muted-foreground">{t.sub}</p> : null}
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RankedList
          title="Top pages"
          description="Most-viewed paths on the store."
          rows={topPages}
          unit="views"
        />
        <RankedList
          title="Traffic channels"
          description="Where sessions come from."
          rows={channels}
          unit="sessions"
        />
      </div>
    </GaSectionShell>
  );
}
