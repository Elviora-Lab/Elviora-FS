import Link from 'next/link';
import { ExternalLink, X } from 'lucide-react';

import { cn } from '@/lib/cn';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { GaTrendChart } from './ga-trend-chart';

import {
  DEFAULT_GA_RANGE,
  GA_RANGE_LABELS,
  GA_RANGES,
  type GaRange,
  type GaRow,
  getGaOverview,
} from '@/server/analytics/ga-data-api';

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

/** A ranked list with a subtle proportional bar behind each row. Rows link via
 *  `hrefFor` when provided (e.g. to drill into a country). */
function RankedList({
  title,
  description,
  rows,
  unit,
  emptyLabel,
  hrefFor,
}: {
  title: string;
  description: string;
  rows: GaRow[];
  unit: string;
  emptyLabel: string;
  hrefFor?: (label: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ol className="divide-y divide-border/60">
            {rows.map((r, i) => {
              const inner = (
                <>
                  <span className="w-4 text-center text-xs text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{r.label || '(not set)'}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {fmtInt(r.value)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
                  </span>
                </>
              );
              const href = hrefFor?.(r.label);
              return (
                <li key={`${r.label}-${i}`} className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-1.5 left-2 rounded bg-accent/10"
                    style={{ width: `${(r.value / max) * 96}%` }}
                  />
                  {href ? (
                    <Link
                      href={href}
                      className="relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="relative flex items-center gap-3 px-4 py-2.5 text-sm">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h3>
  );
}

export async function GaOverview({
  range = DEFAULT_GA_RANGE,
  country,
}: {
  range?: GaRange;
  country?: string;
}) {
  const result = await getGaOverview(GA_RANGES[range], { country });

  // Compose URLs that preserve the other param (range ↔ country).
  const buildHref = (next: { range?: GaRange; country?: string | null }) => {
    const params = new URLSearchParams();
    const r = next.range ?? range;
    if (r && r !== DEFAULT_GA_RANGE) params.set('range', r);
    const c = next.country === null ? undefined : (next.country ?? country);
    if (c) params.set('country', c);
    const qs = params.toString();
    return `/admin/analytics${qs ? `?${qs}` : ''}`;
  };

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="editorial-heading text-display-sm">Google Analytics</h2>
        <p className="text-sm text-muted-foreground">Live from GA4 — {GA_RANGE_LABELS[range]}.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex rounded-md border border-border p-0.5">
          {(Object.keys(GA_RANGES) as GaRange[]).map((r) => (
            <Link
              key={r}
              href={buildHref({ range: r })}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                r === range
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r}
            </Link>
          ))}
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
    </div>
  );

  if (!result.ok) {
    return (
      <section className="flex flex-col gap-4">
        {header}
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
      </section>
    );
  }

  const { kpis, daily, events, topPages, channels, countries, cities, regions, devices, browsers } =
    result.data;
  const activeCountry = result.data.country;
  const emptyLabel = `No data for ${GA_RANGE_LABELS[range].toLowerCase()}.`;

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
    <section className="flex flex-col gap-5">
      {header}

      {activeCountry ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Location</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 font-medium">
            {activeCountry}
            <Link
              href={buildHref({ country: null })}
              aria-label="Clear location filter"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Link>
          </span>
        </div>
      ) : null}

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

      {daily.length >= 2 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active users</CardTitle>
            <CardDescription>Daily, over {GA_RANGE_LABELS[range].toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardContent>
            <GaTrendChart points={daily} />
          </CardContent>
        </Card>
      ) : null}

      <SubHeading>Engagement</SubHeading>
      <RankedList
        title="Top events"
        description="Which GA4 events fire most — including the ecommerce events the store sends."
        rows={events}
        unit="events"
        emptyLabel={emptyLabel}
      />

      <SubHeading>Acquisition &amp; content</SubHeading>
      <div className="grid gap-6 lg:grid-cols-2">
        <RankedList
          title="Top pages"
          description="Most-viewed paths."
          rows={topPages}
          unit="views"
          emptyLabel={emptyLabel}
        />
        <RankedList
          title="Traffic channels"
          description="Where sessions come from."
          rows={channels}
          unit="sessions"
          emptyLabel={emptyLabel}
        />
      </div>

      <SubHeading>Location</SubHeading>
      <div className="grid gap-6 lg:grid-cols-3">
        <RankedList
          title="Countries"
          description={activeCountry ? 'Filtered view.' : 'Click to filter everything.'}
          rows={countries}
          unit="users"
          emptyLabel={emptyLabel}
          hrefFor={activeCountry ? undefined : (label) => buildHref({ country: label })}
        />
        <RankedList
          title="Cities"
          description={activeCountry ? `In ${activeCountry}.` : 'Most active cities.'}
          rows={cities}
          unit="users"
          emptyLabel={emptyLabel}
        />
        <RankedList
          title="Regions"
          description={activeCountry ? `In ${activeCountry}.` : 'States / provinces.'}
          rows={regions}
          unit="users"
          emptyLabel={emptyLabel}
        />
      </div>

      <SubHeading>Technology</SubHeading>
      <div className="grid gap-6 lg:grid-cols-2">
        <RankedList
          title="Device category"
          description="Desktop vs mobile vs tablet."
          rows={devices}
          unit="users"
          emptyLabel={emptyLabel}
        />
        <RankedList
          title="Browsers"
          description="What visitors browse with."
          rows={browsers}
          unit="users"
          emptyLabel={emptyLabel}
        />
      </div>
    </section>
  );
}
