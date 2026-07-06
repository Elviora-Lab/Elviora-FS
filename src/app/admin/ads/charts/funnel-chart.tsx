'use client';

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { intText } from '../format';
import { axisTick, CHART, ChartTooltip } from './chart-kit';

export type FunnelStage = { label: string; value: number };

/**
 * Conversion funnel as horizontal bars against a full-width track, so each
 * stage's share of the top of the funnel is visible at a glance. One hue with a
 * gentle depth fade — sequential, colourblind-safe, and value-labelled so it
 * never depends on colour alone.
 */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  const data = stages.map((s, i) => ({
    ...s,
    // Fade later stages a touch; keep enough contrast to stay legible.
    opacity: 1 - Math.min(i, 4) * 0.14,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, stages.length * 52)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 4 }}>
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip
          cursor={{ fill: CHART.track }}
          content={<ChartTooltip format={(v) => intText(v)} />}
        />
        <Bar
          dataKey="value"
          name="People"
          radius={[0, 4, 4, 0]}
          background={{ fill: CHART.track, radius: 4 }}
          isAnimationActive={false}
        >
          {data.map((d) => (
            <Cell key={d.label} fill={CHART.bar} fillOpacity={d.opacity} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => intText(Number(v))}
            fill="hsl(var(--foreground))"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
