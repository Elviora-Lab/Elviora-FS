'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';

import { mainNav, type NavItem } from '@/config/navigation';

import { cn } from '@/lib/cn';

/**
 * Persistent category bar.
 *
 * Replaces the old hover mega-dropdown: every destination is a visible pill,
 * always on screen. The "Makeup" parent is exploded into its real categories
 * (Lips, Eyes, Face, Nails) so nothing hides behind a hover. Horizontally
 * scrollable on narrow screens; the active route is highlighted.
 */
const PILLS: NavItem[] = [
  { label: 'All', href: '/products' },
  ...mainNav.flatMap((item) => (item.children?.length ? item.children : [item])),
];

function isActive(pathname: string, href: string) {
  const [path, query] = href.split('?');
  // The /products pills (All, Best Sellers, New Arrivals) share the same path and
  // differ only by ?sort=. Only the plain "All" pill takes the highlight on
  // /products — otherwise all three match at once, the shared layout-id fill
  // lands on just one, and the others render as active (light) text with no fill,
  // i.e. invisible. (Highlighting the sort variants would need useSearchParams,
  // which would opt every static page out of prerendering.)
  if (path === '/products') return !query && pathname === '/products';
  return pathname === path || pathname.startsWith(path + '/');
}

export function CategoryBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <nav aria-label="Shop categories" className="border-t border-border/40">
      <div className="container">
        <ul className="-mx-1 flex items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PILLS.map((item, i) => {
            const active = isActive(pathname, item.href);

            const inner = item.comingSoon ? (
              <span className="inline-flex cursor-default select-none items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-foreground/35">
                {item.label}
                <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[8px] tracking-[0.1em]">
                  Soon
                </span>
              </span>
            ) : (
              <Link
                href={item.href}
                data-track="nav"
                data-track-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative inline-flex items-center rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em]',
                  'transition-colors duration-300 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  active ? 'text-background' : 'text-foreground/70 hover:text-foreground',
                )}
              >
                {/* Active pill fill animates between items (shared layout id). */}
                {active ? (
                  <motion.span
                    layoutId="category-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-foreground"
                    transition={
                      reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }
                    }
                  />
                ) : (
                  <span className="absolute inset-0 -z-10 scale-90 rounded-full bg-brand-blush/0 transition-all duration-300 ease-editorial group-hover:scale-100 group-hover:bg-brand-blush/40" />
                )}
                {item.label}
              </Link>
            );

            return (
              <motion.li
                key={item.href}
                className="shrink-0"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.03 * i, ease: [0.22, 1, 0.36, 1] }}
              >
                {inner}
              </motion.li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
