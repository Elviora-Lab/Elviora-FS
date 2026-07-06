'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Shared Recharts building blocks for the ad dashboard.
 *
 * Colours are pulled straight from the app's design tokens (`hsl(var(--…))`), so
 * every chart re-themes automatically for light/dark and the brand skins with no
 * per-mode palette. Bar charts use a single hue (sequential encoding) which is
 * colourblind-safe by construction; the one two-series chart (spend vs revenue)
 * pairs a warm accent with green — hues far enough apart to stay distinct under
 * CVD, and it always ships a legend + tooltip so identity never rests on colour
 * alone.
 */
export const CHART = {
  spend: 'hsl(var(--accent))',
  revenue: 'hsl(var(--success))',
  roas: 'hsl(var(--accent))',
  bar: 'hsl(var(--accent))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))',
  breakEven: 'hsl(var(--muted-foreground))',
  track: 'hsl(var(--muted) / 0.5)',
} as const;

/** Recessive axis tick styling shared across charts. */
export const axisTick = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } as const;

type TooltipRow = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
};

/**
 * Themed tooltip. Pass a `format(value, key)` for the numbers and an optional
 * `labelFormat` for the header. Recharts clones this element with the live
 * `active`/`payload`/`label` props, so those stay optional here.
 */
export function ChartTooltip({
  active,
  label,
  payload,
  format,
  labelFormat,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipRow[];
  format: (value: number, key: string) => string;
  labelFormat?: (label: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-soft">
      {label != null && label !== '' ? (
        <div className="mb-1 font-medium text-foreground">
          {labelFormat ? labelFormat(label) : label}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        {payload.map((row, i) => (
          <div
            key={`${row.dataKey ?? row.name ?? i}`}
            className="flex items-center gap-2 tabular-nums text-muted-foreground"
          >
            {row.color ? (
              <span
                className="inline-block size-2 shrink-0 rounded-sm"
                style={{ background: row.color }}
              />
            ) : null}
            <span>{row.name}</span>
            <span className="ml-auto pl-4 font-medium text-foreground">
              {format(Number(row.value ?? 0), String(row.dataKey ?? ''))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact legend row — used where a chart shows ≥ 2 series or a reference line. */
export function ChartLegend({
  items,
  className,
}: {
  items: { label: string; color: string; dashed?: boolean }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground',
        className,
      )}
    >
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          {it.dashed ? (
            <span
              className="inline-block h-0 w-3 border-t border-dashed"
              style={{ borderColor: it.color }}
            />
          ) : (
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: it.color }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** Placeholder shown when a chart has too little data to be meaningful. */
export function ChartEmpty({ children, height = 220 }: { children: ReactNode; height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-border bg-card px-4 text-center text-sm text-muted-foreground"
      style={{ height }}
    >
      {children}
    </div>
  );
}
