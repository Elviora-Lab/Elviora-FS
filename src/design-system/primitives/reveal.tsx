'use client';

import { type HTMLMotionProps, motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/cn';

/**
 * Reveal — fade + slight upward translate, entered on mount or when scrolled
 * into view. Used liberally for editorial cadence; tasteful, never bouncy.
 *
 * Respects `prefers-reduced-motion`: collapses to a no-op so the content
 * appears in place with no transform / opacity dance.
 *
 *   <Reveal>{children}</Reveal>                  // fade-up on mount
 *   <Reveal as="section" inView>{children}</Reveal> // fade-up when scrolled in
 *   <Reveal delay={0.1}>{children}</Reveal>      // staggered children
 */
type Props = Omit<
  HTMLMotionProps<'div'>,
  'initial' | 'animate' | 'whileInView' | 'transition' | 'children'
> & {
  /** Trigger on scroll into view instead of immediately on mount. */
  inView?: boolean;
  /** Delay in seconds. */
  delay?: number;
  /** Translation distance in px. */
  y?: number;
  children?: React.ReactNode;
};

export function Reveal({ inView = false, delay = 0, y = 14, className, children, ...rest }: Props) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <div className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  const transition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay };
  const hidden = { opacity: 0, y };
  const show = { opacity: 1, y: 0 };

  return inView ? (
    <motion.div
      className={cn(className)}
      initial={hidden}
      whileInView={show}
      viewport={{ once: true, amount: 0.25 }}
      transition={transition}
      {...rest}
    >
      {children}
    </motion.div>
  ) : (
    <motion.div
      className={cn(className)}
      initial={hidden}
      animate={show}
      transition={transition}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
