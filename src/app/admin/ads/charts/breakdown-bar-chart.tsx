'use client';

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { money, moneyCompact } from '../format';
import { axisTick, CHART, ChartTooltip } from './chart-kit';

import type { BreakdownRow } from '@/server/analytics/meta-ads';

/**
 * Spend by segment as a horizontal bar chart (top rows only). One hue — this is
 * a magnitude comparison, not a set of identities — so it stays colourblind-safe
 * and reads top-to-bottom by spend. The full breakdown lives in the table below.
 */
export function BreakdownBarChart({
  rows,
  currency,
  limit = 8,
}: {
  rows: BreakdownRow[];
  currency: string;
  limit?: number;
}) {
  const top = rows.slice(0, limit);
  if (!top.length) return null;
  const max = Math.max(...top.map((r) => r.spend), 1);

  return (
    <ResponsiveContainer width="100%" height={Math.max(140, top.length * 38)}>
      <BarChart data={top} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 4 }}>
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={128}
        />
        <Tooltip
          cursor={{ fill: CHART.track }}
          content={<ChartTooltip format={(v) => money(v, currency)} />}
        />
        <Bar
          dataKey="spend"
          name="Spend"
          fill={CHART.bar}
          radius={[0, 4, 4, 0]}
          background={{ fill: CHART.track, radius: 4 }}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="spend"
            position="right"
            formatter={(v) => moneyCompact(Number(v), currency)}
            fill="hsl(var(--foreground))"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
