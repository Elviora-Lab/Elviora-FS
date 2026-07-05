'use client';

import { useState } from 'react';

import { cn } from '@/lib/cn';

import { intText, money, roasText } from './format';

import type { AdsBreakdowns, BreakdownRow } from '@/server/analytics/meta-ads';

type TabKey = keyof AdsBreakdowns;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'placement', label: 'Placement' },
  { key: 'demographic', label: 'Age & gender' },
  { key: 'device', label: 'Device' },
];

function BreakdownList({ rows, currency }: { rows: BreakdownRow[]; currency: string }) {
  if (!rows.length) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No data for this breakdown.</p>;
  }
  const maxSpend = Math.max(...rows.map((r) => r.spend), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Segment</th>
            <th className="px-4 py-2.5 text-right font-medium">Spend</th>
            <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
            <th className="px-4 py-2.5 text-right font-medium">ROAS</th>
            <th className="px-4 py-2.5 text-right font-medium">Purchases</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((r) => (
            <tr key={r.label} className="transition-colors hover:bg-muted/50">
              <td className="px-4 py-2.5">
                <div className="font-medium">{r.label}</div>
                {/* Spend share bar */}
                <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/60"
                    style={{ width: `${(r.spend / maxSpend) * 100}%` }}
                  />
                </div>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{money(r.spend, currency)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{money(r.revenue, currency)}</td>
              <td
                className={cn(
                  'px-4 py-2.5 text-right font-medium tabular-nums',
                  r.spend > 0 && r.roas < 1 ? 'text-destructive' : '',
                )}
              >
                {roasText(r.roas)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{intText(r.purchases)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BreakdownTabs({
  breakdowns,
  currency,
}: {
  breakdowns: AdsBreakdowns;
  currency: string;
}) {
  const [tab, setTab] = useState<TabKey>('placement');

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1.5 border-b border-border/60 p-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t.key
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <BreakdownList rows={breakdowns[tab]} currency={currency} />
    </div>
  );
}
