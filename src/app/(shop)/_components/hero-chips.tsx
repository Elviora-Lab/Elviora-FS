'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

export type HeroChip = { name: string; href: string };

/**
 * Quick category jump-off chips for the hero. Each chip staggers in, then fills
 * with a blush wash that slides up on hover — a small, pleasant micro-interaction
 * that makes every category tappable right up front.
 */
export function HeroChips({ items }: { items: HeroChip[] }) {
  const reduce = useReducedMotion();
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c, i) => (
        <motion.div
          key={c.href}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href={c.href}
            data-track="nav"
            data-track-label={c.name}
            className="group relative inline-flex overflow-hidden rounded-full border border-border/70 px-4 py-1.5 text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors duration-300 ease-editorial hover:border-transparent hover:text-brand-noir focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden
              className="absolute inset-0 -z-10 translate-y-full bg-gradient-blush transition-transform duration-300 ease-editorial group-hover:translate-y-0"
            />
            {c.name}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
