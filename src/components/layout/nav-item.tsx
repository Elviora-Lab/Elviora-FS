'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import type { NavItem as NavItemType } from '@/config/navigation';

import { cn } from '@/lib/cn';

/**
 * Top-bar nav item.
 *
 * - Items WITHOUT children: simple Link.
 * - Items WITH children: hover- or focus-triggered dropdown.
 *
 * Accessibility:
 *   • The trigger remains a real <Link>, so clicking it navigates to the
 *     category landing page (matches user expectation on luxury commerce).
 *   • Dropdown opens on hover (mouse) AND on keyboard focus-within, so
 *     keyboard users can Tab through and the panel appears.
 *   • Children inside the panel are real links; Esc isn't required because
 *     blur naturally closes the panel via :not(:hover):not(:focus-within).
 *
 * Animation is CSS-driven (opacity + tiny translate) so the panel collapses
 * crisply on hover-out without a flicker. Framer Motion is reserved for the
 * pieces that mount/unmount, not perpetually-rendered ones.
 */
export function NavItem({ item }: { item: NavItemType }) {
  const hasChildren = !!item.children?.length;

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className="rounded text-xs uppercase tracking-[0.14em] text-foreground/90 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={item.href}
        className="inline-flex items-center gap-1 rounded py-2 text-xs uppercase tracking-[0.14em] text-foreground/90 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-haspopup="menu"
      >
        {item.label}
        <ChevronDown
          className="size-3 text-foreground/60 transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180"
          aria-hidden
        />
      </Link>

      {/*
        Hover-bridge: a transparent strip directly under the trigger that
        keeps the dropdown open while the cursor traverses the gap between
        the link and the panel. Without it, the cursor briefly leaves the
        group and the dropdown flickers shut.
      */}
      <div className="pointer-events-none absolute left-0 right-0 top-full h-3 group-focus-within:pointer-events-auto group-hover:pointer-events-auto" />

      <Panel item={item} />
    </div>
  );
}

function Panel({ item }: { item: NavItemType }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      role="menu"
      aria-label={`${item.label} categories`}
      // CSS-driven open/close (group-hover + group-focus-within) → no React
      // state needed. We just initial-animate once on mount for entrance.
      initial={prefersReduced ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'absolute left-1/2 top-full z-50 mt-3 w-[240px] -translate-x-1/2',
        // Hover/focus visibility
        'pointer-events-none invisible opacity-0',
        'group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100',
        'group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100',
        'transition-all duration-200 ease-editorial',
        // Surface
        'rounded-md border border-border/70 bg-card/95 p-3 shadow-elevated backdrop-blur-md',
      )}
    >
      <ul className="flex flex-col">
        {item.children!.map((child) => (
          <li key={child.href}>
            <Link
              href={child.href}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
            >
              <span>{child.label}</span>
              {child.description ? (
                <span className="ml-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {child.description}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
        <li className="mt-1 border-t border-border/60 pt-2">
          <Link
            href={item.href}
            className="block rounded-md px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
          >
            Shop all {item.label} →
          </Link>
        </li>
      </ul>
    </motion.div>
  );
}
