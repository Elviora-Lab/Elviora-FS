'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Sparkle, Star } from 'lucide-react';

import { currentPromotion } from '@/config/promotions';

// Deep antique gold so they read on the pale, rose-tinted hero. Placed in clear
// zones (gutters, above the pill, the copy/product gap, below the stats) so they
// never cover the headline. Deterministic — no RNG.
const STARS = [
  { top: '10%', left: '2%', size: 22, dur: 3.2, delay: 0, kind: 'star' },
  { top: '60%', left: '2%', size: 26, dur: 4.3, delay: 1.2, kind: 'star' },
  { top: '84%', left: '7%', size: 16, dur: 3.6, delay: 0.4, kind: 'sparkle' },
  { top: '3%', left: '46%', size: 16, dur: 3.4, delay: 0.9, kind: 'sparkle' },
  { top: '45%', left: '47%', size: 20, dur: 4.1, delay: 0.3, kind: 'star' },
] as const;

/**
 * Festive gold star-sparkle layer for the hero — only rendered while a campaign
 * (Azadi Sale) is running. Deep antique gold + a soft glow so it reads against
 * the pale rose-tinted hero; layered above the copy but positioned clear of the
 * headline. Decorative + inert under reduced motion.
 */
export function HeroSaleSparkle() {
  const reduce = useReducedMotion();
  if (!currentPromotion()) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {STARS.map((s, i) => {
        const Icon = s.kind === 'sparkle' ? Sparkle : Star;
        return (
          <motion.span
            key={i}
            className="absolute text-[#c19a3e] drop-shadow-[0_0_10px_rgba(193,154,62,0.65)]"
            style={{ top: s.top, left: s.left }}
            initial={reduce ? false : { opacity: 0.4, scale: 0.7, rotate: -10 }}
            animate={
              reduce
                ? { opacity: 0.85 }
                : { opacity: [0.4, 1, 0.4], scale: [0.7, 1, 0.7], rotate: [-10, 10, -10] }
            }
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
          >
            <Icon size={s.size} fill="currentColor" strokeWidth={0} />
          </motion.span>
        );
      })}
    </div>
  );
}
