import Link from 'next/link';
import { Download, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/cn';
import { buildMetadata } from '@/lib/seo/metadata';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ClickBarChart } from '../clicks/_components/click-bar-chart';

import { getAudienceInsights } from '@/server/analytics/audience-insights';

export const metadata = buildMetadata({ title: 'Admin · Audience', noIndex: true });
export const dynamic = 'force-dynamic';

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export default async function AdminAudiencePage() {
  const data = await getAudienceInsights(30);
  const concernRows = data.concerns.map((c) => ({ label: c.label, count: c.count }));
  const searchRows = data.topSearches.map((s) => ({ label: s.keyword, count: s.count }));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="editorial-heading text-display-md">Audience</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Turn your first-party behaviour into reachable Meta audiences and demand signals. With few
          sales, the play is to seed Custom Audiences from the engagement you already have and fix
          the conversion leak — the recommendations below are computed from your real data.
        </p>
      </header>

      {/* Headline */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-[0.1em]">
              Reachable contacts
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{fmt(data.reachableTotal)}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Engaged people you can upload to Meta now
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-[0.1em]">
              Purchasers
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{fmt(data.totalPurchasers)}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {data.totalPurchasers < 50
                ? 'Below Meta’s ~50 needed for purchase-Lookalikes'
                : 'Enough to seed a purchase Lookalike'}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-[0.1em]">
              Demand signals
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{fmt(data.demand.length)}</CardTitle>
            <p className="text-xs text-muted-foreground">Products with interest (last 30 days)</p>
          </CardHeader>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recommended next actions</CardTitle>
          <CardDescription>
            Prioritised from your data — do the high-priority ones first.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.recommendations.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
            >
              <span
                className={cn(
                  'mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  r.priority === 'high'
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {r.priority}
              </span>
              <div>
                <div className="text-sm font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.detail}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Segments + export */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Custom Audience segments
          </h2>
          <p className="text-xs text-muted-foreground">
            Export a segment and upload it in Meta → Audiences → Custom Audience → Customer list.
            Meta hashes the emails/phones on its side.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.segments.map((s) => (
            <Card key={s.key}>
              <CardHeader className="pb-2">
                <div className="flex items-baseline justify-between gap-2">
                  <CardTitle className="text-base">{s.label}</CardTitle>
                  <span className="text-2xl font-semibold tabular-nums">{fmt(s.people)}</span>
                </div>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <span className="text-xs text-muted-foreground">
                  {s.withPhone > 0 ? `${fmt(s.withPhone)} with phone` : 'email only'}
                </span>
                {s.people > 0 ? (
                  <a
                    href={`/api/v1/admin/audience/export?segment=${s.key}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Download className="size-3.5" />
                    Export CSV
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground/60">No contacts yet</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Demand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Demand — high intent, low conversion</CardTitle>
          <CardDescription>
            What shoppers view and add to cart vs. what they actually buy (last 30 days). Rows with
            interest but zero purchases are your conversion leaks — promote them AND fix the page.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.demand.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No product interest recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Product</th>
                    <th className="px-4 py-2.5 text-right font-medium">Views</th>
                    <th className="px-4 py-2.5 text-right font-medium">Add-to-cart</th>
                    <th className="px-4 py-2.5 text-right font-medium">Purchases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.demand.map((d) => (
                    <tr key={d.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/products/${d.id}`}
                          className="font-medium hover:underline"
                        >
                          {d.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmt(d.views)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmt(d.carts)}</td>
                      <td
                        className={cn(
                          'px-4 py-2.5 text-right tabular-nums',
                          d.purchases === 0 && d.intent >= 3 ? 'font-medium text-destructive' : '',
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          {d.purchases === 0 && d.intent >= 3 ? (
                            <TriangleAlert className="size-3.5" aria-label="interest, no sales" />
                          ) : null}
                          {fmt(d.purchases)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concerns + searches */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Skin concerns (AI quiz)</CardTitle>
            <CardDescription>
              Interest segments straight from quiz-takers — match ad creative to these.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {concernRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No quiz data yet — the AI skin quiz isn’t capturing concerns.
              </p>
            ) : (
              <ClickBarChart rows={concernRows} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Top searches</CardTitle>
            <CardDescription>Explicit demand — what people typed looking to buy.</CardDescription>
          </CardHeader>
          <CardContent>
            {searchRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No searches in the last 30 days.</p>
            ) : (
              <ClickBarChart rows={searchRows} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
