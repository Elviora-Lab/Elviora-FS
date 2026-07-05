'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';

import { cn } from '@/lib/cn';

import { intText, money, roasText } from './format';

import type { CampaignInsight } from '@/server/analytics/meta-ads';

type StatusFilter = 'all' | 'active' | 'paused';
type SortKey = 'name' | 'spend' | 'revenue' | 'roas' | 'addToCart' | 'checkout' | 'purchases';

const NUMERIC_COLS: { key: SortKey; label: string }[] = [
  { key: 'spend', label: 'Spend' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'roas', label: 'ROAS' },
  { key: 'addToCart', label: 'Add to cart' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'purchases', label: 'Purchases' },
];

function valueFor(c: CampaignInsight, key: SortKey): number | string {
  switch (key) {
    case 'name':
      return c.campaignName.toLowerCase();
    case 'spend':
      return c.spend;
    case 'revenue':
      return c.revenue;
    case 'roas':
      return c.roas;
    case 'addToCart':
      return c.funnel.addToCart;
    case 'checkout':
      return c.funnel.checkout;
    case 'purchases':
      return c.purchases;
  }
}

function StatusBadge({ status, isActive }: { status: string; isActive: boolean }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const label = isActive ? 'Active' : status === 'PAUSED' ? 'Paused' : titleCase(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        isActive ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', isActive ? 'bg-success' : 'bg-muted-foreground/50')}
      />
      {label}
    </span>
  );
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function CampaignsTable({
  campaigns,
  currency,
}: {
  campaigns: CampaignInsight[];
  currency: string;
}) {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [hideZero, setHideZero] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const activeCount = campaigns.filter((c) => c.isActive).length;

  const rows = useMemo(() => {
    let list = campaigns;
    if (status === 'active') list = list.filter((c) => c.isActive);
    else if (status === 'paused') list = list.filter((c) => !c.isActive);
    if (hideZero) list = list.filter((c) => c.spend > 0);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((c) => c.campaignName.toLowerCase().includes(q));

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = valueFor(a, sortKey);
      const bv = valueFor(b, sortKey);
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [campaigns, status, query, hideZero, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  const SortArrow = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === 'asc' ? (
        <ArrowUp className="inline size-3" />
      ) : (
        <ArrowDown className="inline size-3" />
      )
    ) : null;

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: `All (${campaigns.length})` },
    { key: 'active', label: `Active (${activeCount})` },
    { key: 'paused', label: `Paused (${campaigns.length - activeCount})` },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Controls */}
      <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                status === f.key
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              {f.label}
            </button>
          ))}
          <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={hideZero}
              onChange={(e) => setHideZero(e.target.checked)}
              className="size-3.5 rounded border-border"
            />
            Hide zero-spend
          </label>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns…"
            className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm sm:w-56"
          />
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          No campaigns match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="hover:text-foreground"
                  >
                    Campaign <SortArrow col="name" />
                  </button>
                </th>
                {NUMERIC_COLS.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="hover:text-foreground"
                    >
                      {col.label} <SortArrow col={col.key} />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">CPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((c) => (
                <tr
                  key={c.campaignId || c.campaignName}
                  className="transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} isActive={c.isActive} />
                  </td>
                  <td
                    className="max-w-[240px] truncate px-4 py-3 font-medium"
                    title={c.campaignName}
                  >
                    {c.campaignName}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(c.spend, currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(c.revenue, currency)}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-medium tabular-nums',
                      c.spend > 0 && c.roas < 1 ? 'text-destructive' : '',
                    )}
                  >
                    {roasText(c.roas)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {intText(c.funnel.addToCart)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {intText(c.funnel.checkout)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{intText(c.purchases)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.purchases > 0 ? money(c.costPerPurchase, currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
