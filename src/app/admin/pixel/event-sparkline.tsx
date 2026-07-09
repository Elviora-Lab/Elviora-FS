'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

import type { PixelSeriesPoint } from '@/server/analytics/pixel-events';

/**
 * Compact daily-trend sparkline for a single pixel event (small-multiples).
 *
 * Each event gets its own card + its own Y scale, which sidesteps the huge
 * magnitude gap between events (ViewContent ≫ AddToCart ≫ Purchase) that a
 * single shared-axis multi-line chart would render unreadable. Identity comes
 * from the card title, so colour here is purely decorative.
 */

type TipRow = { value?: number | string; payload?: PixelSeriesPoint };

function Tip({ active, payload }: { active?: boolean; payload?: TipRow[] }) {
  const row = payload?.[0];
  if (!active || !row) return null;
  const date = row.payload?.date ?? '';
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-soft">
      <div className="font-medium text-foreground">{date.slice(5)}</div>
      <div className="tabular-nums text-muted-foreground">
        {Number(row.value ?? 0).toLocaleString('en-US')} events
      </div>
    </div>
  );
}

export function EventSparkline({
  points,
  color,
  gradientId,
}: {
  points: PixelSeriesPoint[];
  color: string;
  gradientId: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <YAxis hide domain={[0, 'dataMax']} />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
          content={<Tip />}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={1.75}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 3 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
