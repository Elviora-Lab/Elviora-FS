'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/cn';

type Category = { id: string; name: string };

const chip = (active: boolean) =>
  cn(
    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
    active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70',
  );

const field =
  'rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const AUDIENCES = [
  ['all', 'All'],
  ['user', 'Logged-in'],
  ['guest', 'Guest'],
] as const;

const PRESETS = ['7d', '30d', '90d'] as const;

/**
 * Filter bar for /admin/pixel. Everything lives in the URL so the server
 * component re-queries. Presets + a custom date range, audience split, and a
 * category scope.
 */
export function PixelFilters({
  categories,
  campaigns,
  sources,
}: {
  categories: Category[];
  campaigns: string[];
  sources: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (updates: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`${pathname}?${p.toString()}`);
  };

  const audience = params.get('audience') ?? 'all';
  const category = params.get('category') ?? '';
  const campaign = params.get('campaign') ?? '';
  const source = params.get('source') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const custom = Boolean(from && to);
  const range = params.get('range') ?? '30d';

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
      {/* Date */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 text-xs text-muted-foreground">Date</span>
        {PRESETS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => set({ range: r, from: null, to: null })}
            className={chip(!custom && range === r)}
          >
            {r}
          </button>
        ))}
        <span className="px-1 text-muted-foreground/40">|</span>
        <input
          type="date"
          aria-label="From date"
          value={from}
          max={to || undefined}
          onChange={(e) => set({ from: e.target.value || null, range: null })}
          className={field}
        />
        <span className="text-xs text-muted-foreground">→</span>
        <input
          type="date"
          aria-label="To date"
          value={to}
          min={from || undefined}
          onChange={(e) => set({ to: e.target.value || null, range: null })}
          className={field}
        />
      </div>

      {/* Audience + Category */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 text-xs text-muted-foreground">Audience</span>
        {AUDIENCES.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => set({ audience: v === 'all' ? null : v })}
            className={chip(audience === v)}
          >
            {label}
          </button>
        ))}
        <span className="px-1 text-muted-foreground/40">|</span>
        <span className="text-xs text-muted-foreground">Category</span>
        <select
          value={category}
          onChange={(e) => set({ category: e.target.value || null })}
          className={field}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Campaign / source — only once some UTM attribution has been captured. */}
      {campaigns.length || sources.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs text-muted-foreground">Campaign</span>
          <select
            value={campaign}
            onChange={(e) => set({ campaign: e.target.value || null })}
            className={field}
          >
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="px-1 text-muted-foreground/40">|</span>
          <span className="text-xs text-muted-foreground">Source</span>
          <select
            value={source}
            onChange={(e) => set({ source: e.target.value || null })}
            className={field}
          >
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
