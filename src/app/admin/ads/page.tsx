import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';

import { cn } from '@/lib/cn';
import { buildMetadata } from '@/lib/seo/metadata';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { BreakdownTabs } from './breakdown-tabs';
import { CampaignsTable } from './campaigns-table';
import { deltaPct, intText, money, roasText } from './format';
import { TrendChart } from './trend-chart';

import {
  AD_DATE_PRESET_LABELS,
  type AdDatePreset,
  type AdsInsight,
  adsInsightsEnabled,
  type AdsOverview,
  getAdsOverview,
  isAdDatePreset,
  presetToDateRange,
} from '@/server/analytics/meta-ads';
import { adminAnalyticsRepo } from '@/server/repositories/admin.repo';

type StoreSales = { revenue: number; orders: number; currency: string };

export const metadata = buildMetadata({ title: 'Admin · Ad Performance', noIndex: true });
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ range?: string }> };

const RANGE_TABS: AdDatePreset[] = [
  'today',
  'last_7d',
  'last_30d',
  'last_90d',
  'this_month',
  'last_month',
  'maximum',
];

const DEFAULT_RANGE: AdDatePreset = 'last_30d';

export default async function AdminAdsPage({ searchParams }: Props) {
  const { range: rawRange } = await searchParams;
  const range: AdDatePreset = isAdDatePreset(rawRange) ? rawRange : DEFAULT_RANGE;

  const configured = adsInsightsEnabled();
  const result = configured ? await getAdsOverview(range) : null;

  // Real store sales for the same window — to reconcile against Meta's
  // attributed numbers. Best-effort: never let it break the ads page.
  let storeSales: StoreSales | null = null;
  if (result?.ok) {
    try {
      const { since, until } = presetToDateRange(range);
      storeSales = await adminAnalyticsRepo.salesForRange(since, until);
    } catch {
      storeSales = null;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="editorial-heading text-display-md">Ad Performance</h1>
          <p className="text-sm text-muted-foreground">
            Spend, ROAS, funnel and conversions from Meta Ads
            {result?.ok ? ` · ${result.data.accountName}` : ''}.
          </p>
        </div>

        {configured ? (
          <nav className="flex flex-wrap gap-1.5" aria-label="Date range">
            {RANGE_TABS.map((preset) => (
              <Link
                key={preset}
                href={`/admin/ads?range=${preset}`}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  preset === range
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70',
                )}
              >
                {AD_DATE_PRESET_LABELS[preset]}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      {!configured ? <SetupCard /> : null}

      {result && !result.ok ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Couldn’t load ad data</CardTitle>
            <CardDescription>Meta’s API returned an error.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-md bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
              {result.error}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Common causes: the token lacks <code>ads_read</code>, the ad account id is wrong, or
              the token has expired. See the setup steps and try again.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {result?.ok ? <Overview data={result.data} range={range} storeSales={storeSales} /> : null}
    </div>
  );
}

function DeltaBadge({
  current,
  previous,
  goodDirection = 'up',
}: {
  current: number;
  previous: number | null | undefined;
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

function Overview({
  data,
  range,
  storeSales,
}: {
  data: AdsOverview;
  range: AdDatePreset;
  storeSales: StoreSales | null;
}) {
  const { account, previous, previousLabel, campaigns, currency, breakdowns, topAds, daily } = data;

  const tiles = [
    {
      label: 'Amount spent',
      value: money(account.spend, currency),
      delta: <DeltaBadge current={account.spend} previous={previous?.spend} goodDirection="none" />,
      sub: previousLabel,
    },
    {
      label: 'Purchase revenue',
      value: money(account.revenue, currency),
      delta: <DeltaBadge current={account.revenue} previous={previous?.revenue} />,
      sub: `${intText(account.purchases)} purchase${account.purchases === 1 ? '' : 's'}`,
    },
    {
      label: 'ROAS',
      value: roasText(account.roas),
      delta: <DeltaBadge current={account.roas} previous={previous?.roas} />,
      sub: account.roas >= 1 ? 'Profitable on ad spend' : 'Below break-even',
      danger: account.roas < 1,
    },
    {
      label: 'Cost per purchase',
      value: account.purchases > 0 ? money(account.costPerPurchase, currency) : '—',
      delta: (
        <DeltaBadge
          current={account.costPerPurchase}
          previous={previous?.costPerPurchase}
          goodDirection="none"
        />
      ),
      sub: 'Spend ÷ purchases',
    },
  ];

  const secondary = [
    { label: 'Impressions', value: intText(account.impressions) },
    { label: 'Reach', value: intText(account.reach) },
    { label: 'Clicks', value: intText(account.clicks) },
    { label: 'CTR', value: `${account.ctr.toFixed(2)}%` },
    { label: 'CPC', value: money(account.cpc, currency) },
    { label: 'CPM', value: money(account.cpm, currency) },
  ];

  return (
    <>
      {/* Headline tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader>
              <CardDescription>{t.label}</CardDescription>
              <div className="flex items-baseline gap-2">
                <CardTitle
                  className={cn(
                    'text-3xl tabular-nums',
                    'danger' in t && t.danger ? 'text-destructive' : '',
                  )}
                >
                  {t.value}
                </CardTitle>
                {t.delta}
              </div>
              <p className="text-xs text-muted-foreground">{t.sub}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* True performance: Meta's attributed numbers vs real store orders */}
      {storeSales ? (
        <Reconciliation account={account} storeSales={storeSales} metaCurrency={currency} />
      ) : null}

      {/* Trend */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Spend &amp; ROAS over time
        </h2>
        <TrendChart daily={daily} currency={currency} />
      </section>

      {/* Funnel */}
      <FunnelStrip data={data} />

      {/* Delivery metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {secondary.map((s) => (
          <Card key={s.label}>
            <CardHeader className="p-4">
              <CardDescription className="text-xs">{s.label}</CardDescription>
              <CardTitle className="text-lg tabular-nums">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Breakdowns + Top ads */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Breakdowns
          </h2>
          <BreakdownTabs breakdowns={breakdowns} currency={currency} />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Top ads by spend
          </h2>
          <TopAds ads={topAds} currency={currency} />
        </section>
      </div>

      {/* Campaigns */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Campaigns
          </h2>
          <span className="text-xs text-muted-foreground">{AD_DATE_PRESET_LABELS[range]}</span>
        </div>
        <CampaignsTable campaigns={campaigns} currency={currency} />
      </section>
    </>
  );
}

function Reconciliation({
  account,
  storeSales,
  metaCurrency,
}: {
  account: AdsInsight;
  storeSales: StoreSales;
  metaCurrency: string;
}) {
  const sameCurrency = metaCurrency === storeSales.currency;
  const blendedRoas = account.spend > 0 ? storeSales.revenue / account.spend : 0;
  const orderShare = storeSales.orders > 0 ? (account.purchases / storeSales.orders) * 100 : null;

  const tiles = [
    {
      label: 'Real store orders',
      value: intText(storeSales.orders),
      sub: `${money(storeSales.revenue, storeSales.currency)} recognized revenue`,
    },
    {
      label: 'Meta claims credit for',
      value: orderShare !== null ? `${orderShare.toFixed(0)}%` : '—',
      sub: `${intText(account.purchases)} of ${intText(storeSales.orders)} orders attributed`,
    },
    {
      label: 'Blended ROAS (MER)',
      value: sameCurrency ? roasText(blendedRoas) : '—',
      sub: sameCurrency ? 'All store revenue ÷ ad spend' : 'Currencies differ — see note',
    },
    {
      label: 'Meta-reported ROAS',
      value: roasText(account.roas),
      sub: 'What Meta attributes',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">True performance</CardTitle>
        <CardDescription>
          Meta’s attributed numbers vs your real store orders for this window.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="text-xs text-muted-foreground">{t.label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{t.value}</div>
              <div className="text-[11px] text-muted-foreground">{t.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {sameCurrency ? (
            <>
              Blended ROAS (MER) counts <strong>all</strong> store revenue against ad spend — the
              honest efficiency of your marketing, organic included. Meta-reported ROAS only counts
              sales it attributes to a click/view and usually over-states its impact.
            </>
          ) : (
            <>
              Ad spend is in {metaCurrency} but store revenue is in {storeSales.currency}, so
              blended ROAS isn’t shown (mixing currencies would mislead). Set your Meta ad account
              to the same currency as your store to enable it.
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function FunnelStrip({ data }: { data: AdsOverview }) {
  const f = data.account.funnel;
  const stages = [
    { label: 'Link clicks', value: f.linkClicks || data.account.clicks },
    { label: 'View content', value: f.viewContent },
    { label: 'Add to cart', value: f.addToCart },
    { label: 'Checkout', value: f.checkout },
    { label: 'Purchases', value: f.purchases },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Conversion funnel</CardTitle>
        <CardDescription>
          Where ad-driven visitors drop off, from click to purchase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          {stages.map((s, i) => {
            const prev = i > 0 ? (stages[i - 1]?.value ?? null) : null;
            const rate = prev && prev > 0 ? (s.value / prev) * 100 : null;
            return (
              <div key={s.label} className="flex flex-1 items-stretch gap-3">
                {i > 0 ? (
                  <div className="hidden flex-col items-center justify-center sm:flex">
                    <ArrowRight className="size-4 text-muted-foreground" />
                    {rate !== null ? (
                      <span
                        className={cn(
                          'mt-0.5 text-[10px] font-medium tabular-nums',
                          rate < 20 ? 'text-destructive' : 'text-muted-foreground',
                        )}
                      >
                        {rate.toFixed(0)}%
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex-1 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">{intText(s.value)}</div>
                  {i > 0 && rate !== null ? (
                    <div className="text-[11px] text-muted-foreground">
                      {rate.toFixed(1)}% of prev
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TopAds({ ads, currency }: { ads: AdsOverview['topAds']; currency: string }) {
  if (!ads.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No ad-level data for this window.
      </div>
    );
  }
  return (
    <div className="flex flex-col divide-y divide-border/60 rounded-lg border border-border bg-card">
      {ads.map((ad) => (
        <div key={ad.adId} className="flex items-center gap-3 p-3">
          <span className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
            {ad.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Meta fbcdn thumbnails, not app assets
              <img src={ad.thumbnailUrl} alt="" className="size-full object-cover" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium" title={ad.adName}>
              {ad.adName}
            </div>
            <div className="truncate text-xs text-muted-foreground" title={ad.campaignName}>
              {ad.campaignName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium tabular-nums">{money(ad.spend, currency)}</div>
            <div
              className={cn(
                'text-xs tabular-nums',
                ad.spend > 0 && ad.roas < 1 ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {roasText(ad.roas)} · {intText(ad.purchases)} sales
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SetupCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Connect Meta Ads</CardTitle>
        <CardDescription>
          Read-only — this dashboard only reads your ad performance; it never changes campaigns or
          spends money.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
        <ol className="ml-4 list-decimal space-y-2">
          <li>
            In <strong>Business Settings → Users → System Users</strong>, create (or open) a system
            user and <strong>Generate a token</strong> for your app with the <code>ads_read</code>{' '}
            permission.
          </li>
          <li>
            Assign that system user to your <strong>ad account</strong> with view access.
          </li>
          <li>
            Copy your <strong>ad account id</strong> (Ads Manager → Account overview — the number
            after <code>act_</code>).
          </li>
          <li>
            Set these environment variables and redeploy:
            <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
              META_ADS_ACCESS_TOKEN=EAAG...your_system_user_token{'\n'}
              META_ADS_ACCOUNT_ID=1234567890
            </pre>
          </li>
        </ol>
        <p>
          Same permissions wall as the Conversions API token — you need an admin role on the
          Business and ad account to generate it. Until both variables are set, this page stays
          exactly as it is now. Full walkthrough in <code>docs/meta-ads-dashboard.md</code>.
        </p>
      </CardContent>
    </Card>
  );
}
