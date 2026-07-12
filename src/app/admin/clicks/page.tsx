import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { cn } from '@/lib/cn';
import { buildMetadata } from '@/lib/seo/metadata';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ClickBarChart } from './_components/click-bar-chart';
import { ClicksTrendChart } from './_components/clicks-trend-chart';

import {
  CLICK_RANGE_LABELS,
  CLICK_RANGES,
  DEFAULT_CLICK_RANGE,
  getClickDashboard,
  isClickRange,
} from '@/server/analytics/click-events';

export const metadata = buildMetadata({ title: 'Admin · Clicks', noIndex: true });
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ range?: string }> };

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

const TYPE_LABELS: Record<string, string> = {
  product: 'Product cards',
  nav: 'Navigation',
  cta: 'Call-to-action',
  banner: 'Banners / hero',
  link: 'Other links',
  button: 'Buttons',
  other: 'Other',
};

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        up ? 'text-success' : 'text-destructive',
      )}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export default async function AdminClicksPage({ searchParams }: Props) {
  const { range: rawRange } = await searchParams;
  const range = isClickRange(rawRange) ? rawRange : DEFAULT_CLICK_RANGE;
  const data = await getClickDashboard(CLICK_RANGES[range]);

  const topPage = data.topPages[0]?.path ?? '—';
  const typeRows = data.byType.map((r) => ({
    label: TYPE_LABELS[r.type] ?? r.type,
    count: r.count,
  }));
  const targetRows = data.topTargets.map((r) => ({ label: r.label, count: r.count }));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="editorial-heading text-display-md">Clicks</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          First-party clickstream — which links, products and CTAs shoppers tap, and when. Captured
          in your own database (ad-blocker-proof), complementing the{' '}
          <Link href="/admin/pixel" className="underline underline-offset-2 hover:text-foreground">
            Pixel Events
          </Link>{' '}
          funnel.
        </p>
      </header>

      {/* Range switcher */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {(Object.keys(CLICK_RANGES) as Array<keyof typeof CLICK_RANGES>).map((r) => (
          <Link
            key={r}
            href={`/admin/clicks?range=${r}`}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm transition-colors',
              r === range
                ? 'border-foreground font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {CLICK_RANGE_LABELS[r]}
          </Link>
        ))}
      </div>

      {!data.captureEnabled && data.totalClicks === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Click capture is <span className="font-medium">idle in this environment</span> — like the
          Meta Pixel and GA, it runs in <span className="font-medium">production</span> only and
          activates automatically on production deploys.
        </div>
      ) : null}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-[0.1em]">
              Total clicks
            </CardDescription>
            <div className="flex items-baseline justify-between gap-2">
              <CardTitle className="text-3xl tabular-nums">{fmtInt(data.totalClicks)}</CardTitle>
              <DeltaBadge current={data.totalClicks} previous={data.previousClicks} />
            </div>
            <p className="text-xs text-muted-foreground">{data.previousLabel}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-[0.1em]">
              Unique visitors
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{fmtInt(data.uniqueVisitors)}</CardTitle>
            <p className="text-xs text-muted-foreground">Distinct users + guests who clicked</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-[0.1em]">
              Most-clicked page
            </CardDescription>
            <CardTitle className="truncate text-xl" title={topPage}>
              {topPage}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Where clicks happen most</p>
          </CardHeader>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Clicks over time</CardTitle>
          <CardDescription>Daily click volume across the selected window.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.totalClicks === 0 ? (
            <p className="text-sm text-muted-foreground">No clicks recorded yet.</p>
          ) : (
            <ClicksTrendChart points={data.trend} />
          )}
        </CardContent>
      </Card>

      {/* Top targets + by type */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Most-clicked targets</CardTitle>
            <CardDescription>Individual links, products and CTAs by clicks.</CardDescription>
          </CardHeader>
          <CardContent>
            {targetRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clicks recorded yet.</p>
            ) : (
              <ClickBarChart rows={targetRows} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Clicks by type</CardTitle>
            <CardDescription>Where engagement concentrates across UI surfaces.</CardDescription>
          </CardHeader>
          <CardContent>
            {typeRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clicks recorded yet.</p>
            ) : (
              <ClickBarChart rows={typeRows} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products + top pages */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Most-clicked products</CardTitle>
            <CardDescription>Product cards shoppers tap most.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.topProducts.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No product clicks yet.</p>
            ) : (
              <ol className="divide-y divide-border/60">
                {data.topProducts.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                    >
                      <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{p.label}</span>
                      <span className="text-sm font-medium tabular-nums">
                        {p.count.toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          clicks
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Top pages by clicks</CardTitle>
            <CardDescription>Which pages drive the most interaction.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.topPages.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No clicks recorded yet.</p>
            ) : (
              <ol className="divide-y divide-border/60">
                {data.topPages.map((p, i) => (
                  <li key={p.path} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs" title={p.path}>
                      {p.path}
                    </span>
                    <span className="font-medium tabular-nums">{p.count.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="muted">Privacy</Badge>
        Labels are PII-stripped and link URLs drop query strings before storage. Identity is a
        first-party user id or guest cookie — never shared with Meta or Google.
      </p>
    </div>
  );
}
