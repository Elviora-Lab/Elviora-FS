'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * Star rating as a REAL radio group: role="radio" + aria-checked on each star,
 * roving tabindex, and arrow-key navigation — a screen-reader/keyboard user
 * can both perceive and set the rating, not just click star icons.
 */
export function StarRatingInput({
  value,
  onChange,
  label = 'Rating',
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const [hover, setHover] = useState(0);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, (value || 1) - 1));
    }
  }

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          // Roving tabindex: the checked star is the group's single tab stop
          // (falling back to the first star before a rating is chosen).
          tabIndex={value === i || (value === 0 && i === 1) ? 0 : -1}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <Star
            className={cn(
              'size-6 transition-colors',
              (hover || value) >= i
                ? 'fill-brand-gold text-brand-gold'
                : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}
