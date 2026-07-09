import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUp, Check, Minus } from 'lucide-react';

import { cn } from '@/lib/cn';
import { buildMetadata } from '@/lib/seo/metadata';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { EventSparkline } from './event-sparkline';

import {
  DEFAULT_PIXEL_RANGE,
  getPixelDashboard,
  isPixelRange,
  PIXEL_RANGE_LABELS,
  PIXEL_RANGES,
  type PixelDashboard,
  type PixelEventSeries,
  type PixelHealth,
} from '@/server/analytics/pixel-events';

export const metadata = buildMetadata({ title: 'Admin · Pixel Events', noIndex: true });
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ range?: string }> };

// ---------- Formatting ----------

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtMoney = (n: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${fmtInt(n)} ${currency}`;
  }
};

/** Percentage change vs a baseline, or null when there's no valid base. */
function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Period-over-period change pill. Mirrors the Ad Performance page's badge.
 * `goodDirection='up'` colours a rise green (more events = good); `'none'`
 * stays neutral for metrics where direction isn't inherently good/bad.
 */
function DeltaBadge({
  current,
  previous,
  goodDirection = 'up',
}: {
  current: number;
  previous: number;
  goodDirection?: 'up' | 'none';
}) {
  const pct = deltaPct(current, previous);
  if (pct === null) return null;
  const up = pct >= 0;
  const good = goodDirection === 'none' ? null : up === (goodDirection === 'up');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        good === null ? 'text-muted-foreground' : good ? 'text-success' : 'text-destructive',
      )}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

// ---------- Config / health panel ----------

function DestinationStatus({
  label,
  id,
  configured,
  active,
  environment,
}: {
  label: string;
  id: string | null;
  configured: boolean;
  active: boolean;
  environment: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="truncate font-mono text-xs text-muted-foreground">{id ?? '— not set'}</div>
      </div>
      {active ? (
        <Badge variant="success">Live</Badge>
      ) : configured ? (
        <Badge variant="muted">Idle in {environment}</Badge>
      ) : (
        <Badge variant="danger">Not set</Badge>
      )}
    </div>
  );
}

function HealthPanel({ health }: { health: PixelHealth }) {
  const anyIdle =
    (health.pixel.configured && !health.pixel.active) ||
    (health.ga.configured && !health.ga.active);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Tracking setup</CardTitle>
        <CardDescription>
          Where events are sent. The pixel &amp; GA only load in{' '}
          <span className="font-medium">production</span> — the counts below are measured
          server-side, so they&apos;re recorded in every environment regardless.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        <DestinationStatus
          label="Meta Pixel"
          id={health.pixel.id}
          configured={health.pixel.configured}
          active={health.pixel.active}
          environment={health.environment}
        />
        <DestinationStatus
          label="Google Analytics 4"
          id={health.ga.id}
          configured={health.ga.configured}
          active={health.ga.active}
          environment={health.environment}
        />
        <div className="flex items-center justify-between gap-3 py-2">
          <div>
            <div className="text-sm font-medium">Conversions API (server)</div>
            <div className="text-xs text-muted-foreground">
              Deduplicated server-side Purchase events
            </div>
          </div>
          {health.capi.configured ? (
            <Badge variant="success">Configured</Badge>
          ) : (
            <Badge variant="muted">Off</Badge>
          )}
        </div>
        {anyIdle ? (
          <p className="pt-3 text-xs text-muted-foreground">
            Current environment is <span className="font-medium">{health.environment}</span>, so the
            browser tags are idle here. They activate automatically on production deploys.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ---------- Event small-multiple card ----------

function EventCard({ event, previousLabel }: { event: PixelEventSeries; previousLabel: string }) {
  const color = event.positive ? 'hsl(var(--success))' : 'hsl(var(--accent))';
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="font-mono text-xs uppercase tracking-[0.1em]">
          {event.label}
        </CardDescription>
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle className="text-3xl tabular-nums">{fmtInt(event.total)}</CardTitle>
          <DeltaBadge current={event.total} previous={event.previousTotal} />
        </div>
        <p className="text-xs text-muted-foreground">{previousLabel}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <EventSparkline points={event.points} color={color} gradientId={`spark-${event.key}`} />
      </CardContent>
    </Card>
  );
}

// ---------- Funnel strip ----------

function FunnelStrip({
  funnel,
  previousLabel,
}: {
  funnel: PixelDashboard['funnel'];
  previousLabel: string;
}) {
  const { views, carts, purchases, cartRate, purchaseRate, previous } = funnel;
  const steps = [
    { label: 'Product views', value: views, prev: previous.views, rate: null as string | null },
    { label: 'Add to cart', value: carts, prev: previous.carts, rate: fmtPct(cartRate) },
    { label: 'Purchases', value: purchases, prev: previous.purchases, rate: fmtPct(purchaseRate) },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Conversion funnel</CardTitle>
        <CardDescription>
          First-party view → cart → purchase for this window ({previousLabel}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          {steps.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center gap-3">
              <div className="flex-1 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-2xl font-medium tabular-nums">{fmtInt(s.value)}</div>
                  <DeltaBadge current={s.value} previous={s.prev} />
                </div>
                {s.rate ? (
                  <div className="text-xs text-muted-foreground">{s.rate} of views</div>
                ) : null}
              </div>
              {i < steps.length - 1 ? (
                <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Page ----------

export default async function AdminPixelPage({ searchParams }: Props) {
  const { range: rawRange } = await searchParams;
  const range = isPixelRange(rawRange) ? rawRange : DEFAULT_PIXEL_RANGE;
  const data = await getPixelDashboard(PIXEL_RANGES[range]);

  const pixelId = data.health.pixel.id;
  const eventsManagerUrl = pixelId
    ? `https://business.facebook.com/events_manager2/list/pixel/${pixelId}/overview`
    : 'https://business.facebook.com/events_manager2/list';

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="editorial-heading text-display-md">Pixel Events</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The standard events your Meta Pixel &amp; GA4 fire, measured from first-party server logs
          — ad-blocker-proof and always-on. For Meta&apos;s own attributed numbers see{' '}
          <Link href="/admin/ads" className="underline underline-offset-2 hover:text-foreground">
            Ad Performance
          </Link>
          .
        </p>
      </header>

      {/* Range switcher */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {(Object.keys(PIXEL_RANGES) as Array<keyof typeof PIXEL_RANGES>).map((r) => (
          <Link
            key={r}
            href={`/admin/pixel?range=${r}`}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm transition-colors',
              r === range
                ? 'border-foreground font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {PIXEL_RANGE_LABELS[r]}
          </Link>
        ))}
      </div>

      {/* Event volume — small multiples */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.events.map((event) => (
          <EventCard key={event.key} event={event} previousLabel={data.previousLabel} />
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-[0.1em]">
              Purchase value
            </CardDescription>
            <div className="flex items-baseline justify-between gap-2">
              <CardTitle className="text-3xl tabular-nums">
                {fmtMoney(data.revenue.total, data.revenue.currency)}
              </CardTitle>
              <DeltaBadge current={data.revenue.total} previous={data.revenue.previous} />
            </div>
            <p className="text-xs text-muted-foreground">{data.previousLabel}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Gross value of placed orders — the value sent on each Purchase event.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <FunnelStrip funnel={data.funnel} previousLabel={data.previousLabel} />

      {/* Config + coverage */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HealthPanel health={data.health} />

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Event coverage</CardTitle>
            <CardDescription>
              Every tracked event and its destinations. A chart above means we also record it
              first-party.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Event</th>
                    <th className="px-2 py-2 text-center font-medium">Pixel</th>
                    <th className="px-2 py-2 text-center font-medium">GA4</th>
                    <th className="px-2 py-2 text-center font-medium">CAPI</th>
                    <th className="px-2 py-2 text-center font-medium">Charted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.coverage.map((row) => (
                    <tr key={row.event}>
                      <td className="px-4 py-2 font-mono text-xs">{row.event}</td>
                      <CoverageCell on={row.pixel} />
                      <CoverageCell on={row.ga} />
                      <CoverageCell on={row.capi} />
                      <CoverageCell on={Boolean(row.firstParty)} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footnote */}
      <p className="text-xs text-muted-foreground">
        These are first-party counts, so they won&apos;t match Meta exactly (the pixel loses
        ad-blocked traffic; Meta attributes across sessions).{' '}
        <a
          href={eventsManagerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Open Meta Events Manager ↗
        </a>{' '}
        for the pixel&apos;s own received-event view.
      </p>
    </div>
  );
}

function CoverageCell({ on }: { on: boolean }) {
  return (
    <td className="px-2 py-2 text-center">
      {on ? (
        <Check className="mx-auto size-4 text-success" aria-label="yes" />
      ) : (
        <Minus className="mx-auto size-4 text-muted-foreground/40" aria-label="no" />
      )}
    </td>
  );
}
