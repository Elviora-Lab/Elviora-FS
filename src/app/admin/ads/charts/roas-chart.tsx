'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { roasText } from '../format';
import { axisTick, CHART, ChartEmpty, ChartLegend, ChartTooltip } from './chart-kit';

import type { DailyPoint } from '@/server/analytics/meta-ads';

/**
 * Return on ad spend per day, with a dashed break-even reference at 1×. Single
 * series on its own axis (money and a ratio never belong on one scale), so it
 * sits next to the spend/revenue chart rather than sharing it.
 */
export function RoasChart({ daily }: { daily: DailyPoint[] }) {
  const points = daily.filter((d) => d.date);
  if (points.length < 2) {
    return <ChartEmpty height={240}>Not enough days in this range to chart ROAS.</ChartEmpty>;
  }

  const shortDate = (d: string | number) => String(d).slice(5);
  const maxRoas = Math.max(...points.map((p) => p.roas), 1.2);

  return (
    <div className="flex flex-col gap-3">
      <ChartLegend
        items={[
          { label: 'ROAS', color: CHART.roas },
          { label: 'Break-even (1×)', color: CHART.breakEven, dashed: true },
        ]}
      />
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="roasFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.26} />
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
            domain={[0, Math.max(2, Math.ceil(maxRoas))]}
            tickFormatter={(v) => `${v}×`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
            content={<ChartTooltip format={(v) => roasText(v)} labelFormat={(l) => shortDate(l)} />}
          />
          <ReferenceLine y={1} stroke={CHART.breakEven} strokeDasharray="4 4" strokeOpacity={0.6} />
          <Area
            type="monotone"
            dataKey="roas"
            name="ROAS"
            stroke={CHART.roas}
            strokeWidth={2}
            fill="url(#roasFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
