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
  // Two-up always: 4-across breaks mid-word inside the narrow PDP buy-column
  // (its width tracks the viewport, not the container). 2 columns stays legible
  // at any container width and reflows to a clean 2x2.
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {SIGNALS.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-2 text-xs leading-tight text-muted-foreground"
        >
          <s.icon className="size-4 shrink-0 text-foreground/70" />
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
