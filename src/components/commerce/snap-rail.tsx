'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

/**
 * Generic horizontal snap rail for mobile product rows: swipe with snap
 * points, a right-edge fade as the "there's more" affordance, and a thin teal
 * progress thread that maps scroll position (rAF-throttled). Purely
 * presentational — children keep their own interactions.
 */
export function SnapRail({
  children,
  className,
  itemClassName,
  ariaLabel,
}: {
  children: React.ReactNode[];
  className?: string;
  /** Width classes per slide, e.g. 'w-[72vw] sm:w-64'. */
  itemClassName?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = el.scrollWidth - el.clientWidth;
        setProgress(max > 0 ? el.scrollLeft / max : 0);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div
        ref={ref}
        role="list"
        aria-label={ariaLabel}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2"
      >
        {children.map((child, i) => (
          <div key={i} role="listitem" className={cn('shrink-0 snap-start', itemClassName)}>
            {child}
          </div>
        ))}
      </div>

      {/* "More to the right" affordance — fades out at the end of the rail. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent transition-opacity duration-300',
          progress > 0.97 && 'opacity-0',
        )}
      />

      {/* Scroll progress thread. */}
      <div aria-hidden className="mt-1 h-0.5 overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full rounded-full bg-accent transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${Math.max(progress, 0.08)})`, transformOrigin: 'left' }}
        />
      </div>
    </div>
  );
}
