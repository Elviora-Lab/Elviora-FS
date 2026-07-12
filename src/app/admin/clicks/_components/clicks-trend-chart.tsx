'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { axisTick, CHART } from '@/app/admin/ads/charts/chart-kit';
import type { TrendPoint } from '@/server/analytics/click-events';

/** Daily clicks over the selected window. Single-series area, shared tokens. */
export function ClicksTrendChart({ points }: { points: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="clicks-trend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.bar} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART.bar} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          tickFormatter={(d: string) => d.slice(5)}
        />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
          content={<TrendTip />}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={CHART.bar}
          strokeWidth={1.75}
          fill="url(#clicks-trend)"
          dot={false}
          activeDot={{ r: 3 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

type TipRow = { value?: number | string; payload?: TrendPoint };

function TrendTip({ active, payload }: { active?: boolean; payload?: TipRow[] }) {
  const row = payload?.[0];
  if (!active || !row) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-soft">
      <div className="font-medium text-foreground">{row.payload?.date ?? ''}</div>
      <div className="tabular-nums text-muted-foreground">
        {Number(row.value ?? 0).toLocaleString('en-US')} clicks
      </div>
    </div>
  );
}
