import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-foreground text-background',
        outline: 'border-border text-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        gold: 'border-brand-amber/40 bg-brand-amber/15 text-brand-slate dark:text-brand-amber',
        // Discount / promo — solid ember, made to be seen from across the grid.
        deal: 'border-transparent bg-brand-ember text-white shadow-soft',
        // Informational teal (e.g. "New", feature chips).
        info: 'border-transparent bg-brand-mist text-brand-teal',
        success: 'border-success/30 bg-success/15 text-success',
        danger: 'border-destructive/30 bg-destructive/15 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
