import { money, roasText } from './format';

import type { DailyPoint } from '@/server/analytics/meta-ads';

/**
 * Spend (bars) + ROAS (line) over time. Pure inline SVG — no chart dependency,
 * server-rendered, non-interactive. A break-even line marks ROAS = 1.
 */
export function TrendChart({ daily, currency }: { daily: DailyPoint[]; currency: string }) {
  const points = daily.filter((d) => d.date);
  if (points.length < 2) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        Not enough days in this range to chart a trend.
      </div>
    );
  }

  const W = 760;
  const H = 220;
  const padX = 8;
  const padTop = 12;
  const padBottom = 22;
  const chartH = H - padTop - padBottom;
  const innerW = W - padX * 2;
  const slot = innerW / points.length;
  const barW = Math.max(2, Math.min(28, slot * 0.6));

  const maxSpend = Math.max(...points.map((p) => p.spend), 1);
  const maxRoas = Math.max(...points.map((p) => p.roas), 1.2);

  const yBar = (v: number) => padTop + chartH - (v / maxSpend) * chartH;
  const yLine = (v: number) => padTop + chartH - (v / maxRoas) * chartH;
  const xAt = (i: number) => padX + slot * i + slot / 2;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yLine(p.roas).toFixed(1)}`)
    .join(' ');

  const breakEvenY = yLine(1);
  const totalSpend = points.reduce((s, p) => s + p.spend, 0);
  const totalRevenue = points.reduce((s, p) => s + p.revenue, 0);
  const blended = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const labelIdx = [0, Math.floor(points.length / 2), points.length - 1];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-foreground/25" /> Spend
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 bg-[hsl(var(--success))]" /> ROAS
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-3 border-t border-dashed border-muted-foreground" />
          Break-even (1×)
        </span>
        <span className="ml-auto tabular-nums">Range ROAS {roasText(blended)}</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Spend and ROAS trend"
      >
        {/* break-even reference */}
        <line
          x1={padX}
          x2={W - padX}
          y1={breakEvenY}
          y2={breakEvenY}
          stroke="currentColor"
          strokeDasharray="4 4"
          className="text-muted-foreground/40"
        />
        {/* spend bars */}
        {points.map((p, i) => {
          const h = padTop + chartH - yBar(p.spend);
          return (
            <rect
              key={p.date}
              x={xAt(i) - barW / 2}
              y={yBar(p.spend)}
              width={barW}
              height={Math.max(0, h)}
              rx={1.5}
              className="fill-foreground/20"
            >
              <title>{`${p.date}: ${money(p.spend, currency)} spend · ${roasText(p.roas)} ROAS`}</title>
            </rect>
          );
        })}
        {/* ROAS line */}
        <path d={linePath} fill="none" stroke="hsl(var(--success))" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={p.date} cx={xAt(i)} cy={yLine(p.roas)} r={2} fill="hsl(var(--success))" />
        ))}
        {/* date labels */}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={H - 6}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {points[i]?.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
