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

import type { GaDailyPoint } from '@/server/analytics/ga-data-api';

const shortDate = (d: string | number) => String(d).slice(5); // MM-DD

type TipRow = { value?: number | string; payload?: GaDailyPoint };

function Tip({ active, payload }: { active?: boolean; payload?: TipRow[] }) {
  const row = payload?.[0];
  if (!active || !row) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-soft">
      <div className="mb-0.5 font-medium text-foreground">{row.payload?.date ?? ''}</div>
      <div className="tabular-nums text-muted-foreground">
        {Number(row.value ?? 0).toLocaleString('en-US')} active users
      </div>
    </div>
  );
}

/** Daily active-users trend for the GA panel. */
export function GaTrendChart({ points }: { points: GaDailyPoint[] }) {
  if (points.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gaTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.26} />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          minTickGap={28}
        />
        <YAxis
          allowDecimals={false}
          width={28}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
          content={<Tip />}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="users"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          fill="url(#gaTrendFill)"
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
