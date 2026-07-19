import { Star } from 'lucide-react';

import { cn } from '@/lib/cn';

type RatingProps = {
  value: number;
  max?: number;
  size?: number;
  reviewCount?: number;
  className?: string;
};

export function Rating({ value, max = 5, size = 14, reviewCount, className }: RatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="flex">
        {stars.map((i) => {
          const filled = value >= i;
          const half = !filled && value >= i - 0.5;
          return (
            <Star
              key={i}
              width={size}
              height={size}
              strokeWidth={1.5}
              className={cn(
                'text-brand-amber',
                filled ? 'fill-brand-amber' : half ? 'fill-brand-amber/40' : 'fill-transparent',
              )}
              aria-hidden
            />
          );
        })}
      </span>
      {typeof reviewCount === 'number' ? (
        <span className="text-xs text-muted-foreground">({reviewCount})</span>
      ) : null}
      <span className="sr-only">
        {value} out of {max}
      </span>
    </span>
  );
}
