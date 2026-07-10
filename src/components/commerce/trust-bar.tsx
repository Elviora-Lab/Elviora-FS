import { BadgeCheck, Lock, RotateCcw, Truck } from 'lucide-react';

import { cn } from '@/lib/cn';

const SIGNALS = [
  { icon: Lock, label: 'Secure checkout' },
  { icon: Truck, label: 'Cash on delivery' },
  { icon: RotateCcw, label: '30-day returns' },
  { icon: BadgeCheck, label: '100% authentic' },
];

/**
 * Trust signals — reduces last-mile purchase anxiety (especially for COD
 * shoppers). Honest claims that match the store's actual policies.
 */
export function TrustBar({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}>
      {SIGNALS.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground"
        >
          <s.icon className="size-4 shrink-0 text-foreground/70" />
          {s.label}
        </div>
      ))}
    </div>
  );
}
