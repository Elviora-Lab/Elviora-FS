import Link from 'next/link';

import { cn } from '@/lib/cn';
import { buildMetadata } from '@/lib/seo/metadata';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  AD_DATE_PRESET_LABELS,
  type AdDatePreset,
  type AdsInsight,
  adsInsightsEnabled,
  type AdsOverview,
  getAdsOverview,
  isAdDatePreset,
} from '@/server/analytics/meta-ads';

export const metadata = buildMetadata({ title: 'Admin · Ad Performance', noIndex: true });
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ range?: string }> };

// The presets we surface as quick filters (Meta supports more; these cover the
// day-to-day questions).
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

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    // Unknown/invalid currency code — fall back to a plain number + code.
    return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
  }
}

const roasText = (roas: number) => `${roas.toFixed(2)}×`;

export default async function AdminAdsPage({ searchParams }: Props) {
  const { range: rawRange } = await searchParams;
  const range: AdDatePreset = isAdDatePreset(rawRange) ? rawRange : DEFAULT_RANGE;

  const configured = adsInsightsEnabled();
  const result = configured ? await getAdsOverview(range) : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="editorial-heading text-display-md">Ad Performance</h1>
          <p className="text-sm text-muted-foreground">
            Spend, ROAS and conversions from Meta Ads
            {result?.ok ? ` · ${result.data.accountName}` : ''}.
          </p>
        </div>

        {/* Date-range tabs — plain links so the page stays a server component. */}
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

      {result?.ok ? <Overview data={result.data} range={range} /> : null}
    </div>
  );
}

function Overview({ data, range }: { data: AdsOverview; range: AdDatePreset }) {
  const { account, campaigns, currency } = data;

  const tiles = [
    {
      label: 'Amount spent',
      value: money(account.spend, currency),
      sub: AD_DATE_PRESET_LABELS[range],
    },
    {
      label: 'Purchase revenue',
      value: money(account.revenue, currency),
      sub: `${account.purchases.toLocaleString()} purchase${account.purchases === 1 ? '' : 's'}`,
    },
    {
      label: 'ROAS',
      value: roasText(account.roas),
      sub: account.roas >= 1 ? 'Profitable on ad spend' : 'Below break-even',
      highlight: account.roas < 1 ? 'bad' : 'good',
    },
    {
      label: 'Cost per purchase',
      value: account.purchases > 0 ? money(account.costPerPurchase, currency) : '—',
      sub: 'Spend ÷ purchases',
    },
  ] as const;

  const secondary: { label: string; value: string }[] = [
    { label: 'Impressions', value: account.impressions.toLocaleString() },
    { label: 'Reach', value: account.reach.toLocaleString() },
    { label: 'Clicks', value: account.clicks.toLocaleString() },
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
              <CardTitle
                className={cn(
                  'text-3xl tabular-nums',
                  'highlight' in t && t.highlight === 'bad' ? 'text-destructive' : '',
                )}
              >
                {t.value}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t.sub}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

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

      {/* Per-campaign breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Campaigns</CardTitle>
          <CardDescription>
            Ranked by spend over {AD_DATE_PRESET_LABELS[range].toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No campaigns had delivery in this window.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 text-right font-medium">Spend</th>
                    <th className="px-4 py-3 text-right font-medium">Revenue</th>
                    <th className="px-4 py-3 text-right font-medium">ROAS</th>
                    <th className="px-4 py-3 text-right font-medium">Purchases</th>
                    <th className="px-4 py-3 text-right font-medium">CPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {campaigns.map((c) => (
                    <CampaignRow key={c.campaignId || c.campaignName} c={c} currency={currency} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function CampaignRow({
  c,
  currency,
}: {
  c: AdsInsight & { campaignName: string };
  currency: string;
}) {
  return (
    <tr className="transition-colors hover:bg-muted/50">
      <td className="max-w-[280px] truncate px-4 py-3 font-medium">{c.campaignName}</td>
      <td className="px-4 py-3 text-right tabular-nums">{money(c.spend, currency)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{money(c.revenue, currency)}</td>
      <td
        className={cn(
          'px-4 py-3 text-right font-medium tabular-nums',
          c.roas < 1 ? 'text-destructive' : '',
        )}
      >
        {roasText(c.roas)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{c.purchases.toLocaleString()}</td>
      <td className="px-4 py-3 text-right tabular-nums">
        {c.purchases > 0 ? money(c.costPerPurchase, currency) : '—'}
      </td>
    </tr>
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
          exactly as it is now.
        </p>
      </CardContent>
    </Card>
  );
}
