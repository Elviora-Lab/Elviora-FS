import type { Transition, Variants } from 'framer-motion';

export const easing = {
  editorial: [0.22, 1, 0.36, 1] as const,
  luxe: [0.65, 0, 0.35, 1] as const,
  swift: [0.4, 0, 0.2, 1] as const,
};

export const duration = {
  instant: 0.12,
  fast: 0.2,
  base: 0.32,
  slow: 0.5,
  cinematic: 0.8,
} as const;

export const transitions = {
  base: { duration: duration.base, ease: easing.editorial } satisfies Transition,
  swift: { duration: duration.fast, ease: easing.swift } satisfies Transition,
  cinematic: { duration: duration.cinematic, ease: easing.luxe } satisfies Transition,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: transitions.base },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: transitions.cinematic },
};
