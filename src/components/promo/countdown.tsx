'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

function parts(ms: number) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

/**
 * Live countdown to an ISO target. Renders nothing until mounted (so SSR and the
 * first client paint agree — no hydration mismatch), then ticks every second.
 */
export function Countdown({ to, className }: { to: string; className?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;

  const p = parts(target - now);
  const units = [
    { label: 'Days', value: p.days },
    { label: 'Hrs', value: p.hours },
    { label: 'Min', value: p.mins },
    { label: 'Sec', value: p.secs },
  ];

  return (
    <div className={cn('flex items-center gap-2.5', className)} role="timer" aria-live="off">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-2.5">
          <div className="flex min-w-[3ch] flex-col items-center">
            <span className="font-serif text-3xl font-light tabular-nums leading-none">
              {String(u.value).padStart(2, '0')}
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.18em] opacity-70">
              {u.label}
            </span>
          </div>
          {i < units.length - 1 ? (
            <span className="pb-3 text-xl font-light leading-none opacity-30" aria-hidden>
              :
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
