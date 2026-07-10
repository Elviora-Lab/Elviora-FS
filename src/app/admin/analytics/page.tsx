import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { GaOverview } from './_components/ga-overview';

import { adminAnalyticsRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Analytics', noIndex: true });
export const dynamic = 'force-dynamic';

const WINDOW_DAYS = 30;

const pct = (num: number, denom: number) =>
  denom > 0 ? `${((num / denom) * 100).toFixed(1)}%` : '—';

type Ranked = { id: string; name: string; slug: string; imageUrl: string; count: number };

function ProductRankList({
  title,
  description,
  rows,
  unit,
}: {
  title: string;
  description: string;
  rows: Ranked[];
  unit: string;
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
            No activity yet in the last {WINDOW_DAYS} days.
          </p>
        ) : (
          <ol className="divide-y divide-border/60">
            {rows.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                  <span className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-sm font-medium tabular-nums">
                    {p.count.toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminAnalyticsPage() {
  const [funnel, topViewed, topAddedToCart, topSearches] = await Promise.all([
    adminAnalyticsRepo.funnel(WINDOW_DAYS),
    adminAnalyticsRepo.topViewed(WINDOW_DAYS),
    adminAnalyticsRepo.topAddedToCart(WINDOW_DAYS),
    adminAnalyticsRepo.topSearches(WINDOW_DAYS),
  ]);

  const tiles = [
    { label: 'Product views', value: funnel.views, sub: `Last ${WINDOW_DAYS} days` },
    {
      label: 'Add-to-carts',
      value: funnel.cartAdds,
      sub: `${pct(funnel.cartAdds, funnel.views)} of views`,
    },
    {
      label: 'Orders',
      value: funnel.orders,
      sub: `${pct(funnel.orders, funnel.cartAdds)} of carts`,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="editorial-heading text-display-md">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Traffic and merchandising performance over the last {WINDOW_DAYS} days.
        </p>
      </header>

      {/* Live Google Analytics (GA4 Data API) — loads independently. */}
      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded-lg border border-border bg-muted/40" />
        }
      >
        <GaOverview />
      </Suspense>

      <div className="border-t border-border pt-2">
        <h2 className="editorial-heading text-display-sm">First-party events</h2>
        <p className="text-sm text-muted-foreground">
          Measured server-side from your own database (ad-blocker-proof).
        </p>
      </div>

      {/* Funnel */}
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader>
              <CardDescription>{t.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{t.value.toLocaleString()}</CardTitle>
              <p className="text-xs text-muted-foreground">{t.sub}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Product rankings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProductRankList
          title="Most viewed"
          description="Which products customers are visiting."
          rows={topViewed}
          unit="views"
        />
        <ProductRankList
          title="Most added to cart"
          description="Which products customers are adding to cart."
          rows={topAddedToCart}
          unit="adds"
        />
      </div>

      {/* Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Top searches</CardTitle>
          <CardDescription>What customers are looking for.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {topSearches.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No searches yet in the last {WINDOW_DAYS} days.
            </p>
          ) : (
            <ol className="divide-y divide-border/60">
              {topSearches.map((s, i) => (
                <li key={s.keyword} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{s.keyword}</span>
                  <span className="font-medium tabular-nums">{s.count.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
