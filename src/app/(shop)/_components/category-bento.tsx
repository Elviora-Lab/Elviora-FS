import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/cn';

export type BentoCategory = {
  name: string;
  href: string;
  blurb?: string | null;
  img?: string | null;
  children?: string[];
};

/**
 * Asymmetric category bento — four data-driven "doors" so an intent-holding
 * shopper self-routes in one viewport. Server component, zero client JS:
 * every micro-interaction is CSS (lift, image zoom, teal underline sweep,
 * chip fade-in). Mobile collapses to a 2×2 grid — all doors visible at once,
 * which is the entire point of chunking.
 */
export function CategoryBento({ categories }: { categories: BentoCategory[] }) {
  const cats = categories.slice(0, 4);
  if (cats.length === 0) return null;

  // Desktop shape: [0] tall feature spanning both rows, [1] and [2] as
  // squares along the top, [3] wide across the bottom — an asymmetric bento
  // rather than four identical tiles.
  const areaClasses = [
    'lg:col-span-2 lg:row-span-2', // tall feature
    'lg:col-span-1 lg:row-span-1',
    'lg:col-span-1 lg:row-span-1',
    'lg:col-span-2 lg:row-span-1', // wide
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-flow-dense lg:grid-cols-4 lg:grid-rows-2">
      {cats.map((c, i) => (
        <Link
          key={c.href}
          href={c.href}
          data-track="nav"
          data-track-label={`bento:${c.name}`}
          className={cn(
            'group relative block overflow-hidden rounded-2xl border border-border bg-brand-sand',
            'transition-all duration-300 ease-swift hover:-translate-y-1 hover:shadow-elevated active:scale-[0.98] motion-reduce:transition-none',
            'aspect-square',
            i === 0 && 'lg:aspect-auto',
            i === 3 && 'lg:aspect-auto',
            areaClasses[i],
          )}
        >
          {c.img ? (
            <Image
              src={c.img}
              alt={c.name}
              fill
              loading="lazy"
              sizes="(min-width:1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 ease-swift group-hover:scale-[1.04] motion-reduce:transition-none"
            />
          ) : (
            <div className="surface-cloud absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/80 via-brand-ink/20 to-transparent" />

          <div className="absolute inset-x-4 bottom-4 flex flex-col gap-1 text-brand-cloud">
            {c.blurb ? (
              <span className="hidden truncate text-[11px] uppercase tracking-[0.12em] opacity-80 lg:block">
                {c.blurb}
              </span>
            ) : null}
            <span className="w-fit font-serif text-xl font-medium md:text-2xl">
              {c.name}
              {/* Teal underline sweep on hover. */}
              <span
                aria-hidden
                className="block h-0.5 origin-left scale-x-0 rounded-full bg-accent transition-transform duration-300 ease-swift group-hover:scale-x-100 motion-reduce:transition-none"
              />
            </span>
            {c.children?.length ? (
              <span className="hidden flex-wrap gap-1.5 pt-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:flex">
                {c.children.slice(0, 3).map((child) => (
                  <span
                    key={child}
                    className="rounded-full bg-brand-cloud/15 px-2.5 py-0.5 text-[11px] backdrop-blur-sm"
                  >
                    {child}
                  </span>
                ))}
              </span>
            ) : null}
          </div>

          <span
            aria-hidden
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-brand-cloud/15 text-sm text-brand-cloud backdrop-blur-sm transition-all duration-300 group-hover:bg-brand-ember group-hover:text-white"
          >
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
