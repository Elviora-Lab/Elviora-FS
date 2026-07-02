import Link from 'next/link';

import { cn } from '@/lib/cn';

export type SubcategoryChip = {
  label: string;
  href: string;
  /** The chip matching the page being viewed. */
  active?: boolean;
};

/**
 * Horizontal chip row linking between a category and its subcategories.
 *
 * Mobile-first: a single swipeable row (no wrapping, hidden scrollbar) so it
 * stays one thumb-friendly line on small screens; from `sm` up it wraps into
 * a regular pill cloud. Server-rendered — chips are plain links.
 */
export function SubcategoryNav({ chips }: { chips: SubcategoryChip[] }) {
  if (chips.length === 0) return null;

  return (
    <nav aria-label="Browse subcategories">
      <ul className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {chips.map((chip) => (
          <li key={chip.href} className="shrink-0">
            <Link
              href={chip.href}
              aria-current={chip.active ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-10 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                chip.active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-foreground/75 hover:border-foreground/40 hover:text-foreground',
              )}
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
