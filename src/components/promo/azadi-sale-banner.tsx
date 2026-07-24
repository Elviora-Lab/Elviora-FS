'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Copy, Sparkles, Star } from 'lucide-react';

import type { Promotion, PromotionPhase } from '@/config/promotions';

import { Countdown } from './countdown';

/** Pakistan flag crescent + star, drawn as a single decorative motif. */
function CrescentStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="currentColor">
      <defs>
        <mask id="crescent-cut">
          <rect width="120" height="120" fill="white" />
          <circle cx="66" cy="56" r="34" fill="black" />
        </mask>
      </defs>
      <circle cx="54" cy="56" r="42" mask="url(#crescent-cut)" />
      <path d="M96 30l3.7 8.3 9 .9-6.8 6 2 8.8L96 58l-7.9 4.9 2-8.8-6.8-6 9-.9z" />
    </svg>
  );
}

// Scattered stars for festive texture (deterministic — no RNG).
const STARS = [
  { top: '20%', left: '6%', size: 11, delay: 0 },
  { top: '66%', left: '13%', size: 7, delay: 0.5 },
  { top: '32%', left: '44%', size: 9, delay: 0.9 },
  { top: '74%', left: '54%', size: 6, delay: 1.3 },
  { top: '24%', left: '70%', size: 8, delay: 0.7 },
  { top: '60%', left: '80%', size: 7, delay: 1.1 },
];

export function AzadiSaleBanner({ promo, phase }: { promo: Promotion; phase: PromotionPhase }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const startLabel = new Date(promo.startsAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });
  const endLabel = new Date(promo.endsAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });
  const phaseLine =
    phase === 'teaser'
      ? `Starts ${startLabel} — get ready`
      : `Use code at checkout · ends ${endLabel}`;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <section aria-label={`${promo.name} promotion`} className="surface-pearl">
      <div className="container py-10 md:py-14">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative isolate overflow-hidden rounded-3xl shadow-luxe ring-1 ring-brand-gold/30"
        >
          {/* Emerald jewel field with depth. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-[radial-gradient(135%_130%_at_14%_-10%,#0f6e48_0%,#0a4b32_46%,#052a15_100%)]"
          />
          {/* Diagonal gold sheen. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,transparent_32%,rgba(214,178,112,0.12)_50%,transparent_68%)]"
          />
          {/* Fine gold-dust texture. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(rgba(240,222,176,0.9)_1px,transparent_1.5px)] [background-size:22px_22px]"
          />
          {/* Gold hairline inside the ring. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-3xl ring-1 ring-inset ring-white/5"
          />

          {/* Glowing gold crescent + star. */}
          <CrescentStar className="pointer-events-none absolute -right-4 top-1/2 -z-10 size-64 -translate-y-1/2 text-brand-champagne/30 drop-shadow-[0_0_34px_rgba(214,178,112,0.4)] md:size-80" />

          {/* Twinkling stars. */}
          {STARS.map((s, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="pointer-events-none absolute -z-10 text-brand-champagne/50"
              style={{ top: s.top, left: s.left }}
              initial={reduce ? false : { opacity: 0.25, scale: 0.8 }}
              animate={reduce ? undefined : { opacity: [0.25, 0.75, 0.25], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 3 + i * 0.4,
                repeat: Infinity,
                delay: s.delay,
                ease: 'easeInOut',
              }}
            >
              <Star size={s.size} fill="currentColor" strokeWidth={0} />
            </motion.span>
          ))}

          <div className="flex flex-col items-start gap-8 p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-brand-champagne">
                <Sparkles className="size-3.5" /> {promo.occasion}
              </span>
              <h2 className="editorial-heading mt-3 bg-gradient-gold bg-clip-text text-display-md text-transparent md:text-display-lg">
                {promo.name}
              </h2>
              <p className="mt-1 font-serif text-2xl font-light text-white/95 md:text-3xl">
                {promo.tagline}
              </p>
              <p className="mt-3 text-sm uppercase tracking-[0.14em] text-white/65">{phaseLine}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={copyCode}
                  className="group inline-flex items-center gap-2 rounded-full border border-dashed border-brand-champagne/60 bg-white/5 px-4 py-2 text-sm font-medium uppercase tracking-[0.18em] text-brand-champagne transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-champagne/60"
                  aria-label={`Copy code ${promo.code}`}
                >
                  {promo.code}
                  {copied ? (
                    <Check className="size-4 text-brand-champagne" />
                  ) : (
                    <Copy className="size-4 opacity-70 transition-opacity group-hover:opacity-100" />
                  )}
                </button>

                <Link
                  href="/products"
                  data-track="cta"
                  data-track-label="azadi-shop"
                  className="inline-flex items-center rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-brand-charcoal shadow-sm transition-transform duration-300 ease-editorial hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-champagne/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a4b32]"
                >
                  Shop the sale
                </Link>
              </div>
            </div>

            {/* Countdown to Independence Day. */}
            <div className="w-full shrink-0 rounded-2xl border border-brand-gold/25 bg-black/20 p-5 backdrop-blur-sm md:w-auto">
              <p className="mb-3 text-center text-[10px] uppercase tracking-[0.2em] text-brand-champagne/80 md:text-left">
                Independence Day in
              </p>
              <Countdown
                to={promo.countdownTo}
                className="justify-center text-white md:justify-start"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
