'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Ambient brand-glow atmosphere for the hero — three soft halos (blush,
 * rosegold, champagne) that gently breathe on a loop.
 *
 * Deliberately lightweight: no cursor tracking, no window listeners, no
 * per-frame rAF — just three transform loops the compositor handles cheaply.
 * (An earlier version tracked the pointer; that ran work on every mousemove and
 * was the hero's biggest main-thread cost, for a subtle effect.) Decorative and
 * fully inert under prefers-reduced-motion.
 */
const HALOS = [
  {
    cls: 'absolute -left-24 top-1/4 size-[28rem] rounded-full bg-brand-blush/50 blur-3xl',
    x: [0, 24, 0],
    y: [0, -18, 0],
    dur: 13,
  },
  {
    cls: 'absolute -right-16 -top-10 size-[22rem] rounded-full bg-brand-rosegold/20 blur-3xl',
    x: [0, -20, 0],
    y: [0, 16, 0],
    dur: 16,
  },
  {
    cls: 'absolute left-[calc(50%-10rem)] top-6 size-[20rem] rounded-full bg-brand-champagne/25 blur-3xl',
    x: [0, 16, 0],
    y: [0, 20, 0],
    dur: 19,
  },
];

export function HeroAtmosphere() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {HALOS.map((h, i) => (
        <motion.div
          key={i}
          className={h.cls}
          animate={reduce ? undefined : { x: h.x, y: h.y }}
          transition={reduce ? undefined : { duration: h.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
