'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Hero headline with a staggered, word-by-word reveal — each word rises and
 * fades in on load for an editorial, "typeset" entrance. Falls back to a plain
 * heading under reduced-motion. Rendered client-side so the stagger runs.
 */
export function HeroHeading({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');

  if (reduce) return <h1 className={className}>{text}</h1>;

  return (
    <h1 className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            aria-hidden
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </h1>
  );
}
