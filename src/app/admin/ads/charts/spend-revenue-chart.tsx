'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { money, moneyCompact } from '../format';
import { axisTick, CHART, ChartEmpty, ChartLegend, ChartTooltip } from './chart-kit';

import type { DailyPoint } from '@/server/analytics/meta-ads';

/**
 * Spend (filled area) vs purchase revenue (line) per day. Both are money, so
 * they share one Y axis — the gap between the area and the line reads directly
 * as profit or loss. Deliberately not the old dual-axis spend+ROAS chart; ROAS
 * lives in its own chart beside this one.
 */
export function SpendRevenueChart({ daily, currency }: { daily: DailyPoint[]; currency: string }) {
  const points = daily.filter((d) => d.date);
  if (points.length < 2) {
    return <ChartEmpty height={240}>Not enough days in this range to chart a trend.</ChartEmpty>;
  }

  const shortDate = (d: string | number) => String(d).slice(5);

  return (
    <div className="flex flex-col gap-3">
      <ChartLegend
        items={[
          { label: 'Spend', color: CHART.spend },
          { label: 'Revenue', color: CHART.revenue },
        ]}
      />
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.24} />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: CHART.grid }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v) => moneyCompact(Number(v), currency)}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
            content={
              <ChartTooltip format={(v) => money(v, currency)} labelFormat={(l) => shortDate(l)} />
            }
          />
          <Area
            type="monotone"
            dataKey="spend"
            name="Spend"
            stroke={CHART.spend}
            strokeWidth={2}
            fill="url(#spendFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={CHART.revenue}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
