'use client';

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { axisTick, CHART, ChartTooltip } from '@/app/admin/ads/charts/chart-kit';

/** Generic horizontal count-bar chart for click segments (targets, types, …). */
export function ClickBarChart({
  rows,
  height,
}: {
  rows: { label: string; count: number }[];
  height?: number;
}) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.count), 1);
  const fmt = (value: number) => `${Math.round(value).toLocaleString('en-US')} clicks`;

  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(140, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }}>
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={148}
          tickFormatter={(s: string) => (s.length > 22 ? `${s.slice(0, 21)}…` : s)}
        />
        <Tooltip cursor={{ fill: CHART.track }} content={<ChartTooltip format={fmt} />} />
        <Bar
          dataKey="count"
          name="Clicks"
          fill={CHART.bar}
          radius={[0, 4, 4, 0]}
          background={{ fill: CHART.track, radius: 4 }}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="count"
            position="right"
            formatter={(v) => Math.round(Number(v)).toLocaleString('en-US')}
            fill="hsl(var(--foreground))"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
