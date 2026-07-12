'use client';

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { axisTick, CHART, ChartTooltip } from '@/app/admin/ads/charts/chart-kit';
import type { GeoRow } from '@/server/analytics/customer-geo';

/**
 * Orders-by-city as a horizontal bar chart. One hue (magnitude comparison, not
 * identities) so it stays colourblind-safe and re-themes for light/dark via the
 * shared design tokens. Tooltip shows revenue alongside the order count.
 */
export function CustomerGeoChart({ rows, currency }: { rows: GeoRow[]; currency: string }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.orders), 1);
  const revenueByLabel = new Map(rows.map((r) => [r.label, r.revenue]));

  const fmt = (value: number, key: string): string => {
    if (key === 'orders') return `${Math.round(value).toLocaleString('en-US')} orders`;
    return value.toLocaleString('en-US');
  };
  const labelFmt = (label: string | number): string => {
    const rev = revenueByLabel.get(String(label)) ?? 0;
    try {
      const money = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(rev);
      return `${label} · ${money}`;
    } catch {
      return String(label);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }}>
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip
          cursor={{ fill: CHART.track }}
          content={<ChartTooltip format={fmt} labelFormat={labelFmt} />}
        />
        <Bar
          dataKey="orders"
          name="Orders"
          fill={CHART.bar}
          radius={[0, 4, 4, 0]}
          background={{ fill: CHART.track, radius: 4 }}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="orders"
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
