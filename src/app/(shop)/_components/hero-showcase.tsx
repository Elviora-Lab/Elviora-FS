'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';

import { currentPromotion } from '@/config/promotions';

import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/cn';

import { Price } from '@/design-system/primitives/price';

export type HeroProduct = {
  slug: string;
  name: string;
  imageUrl: string;
  price: number;
  brandLine?: string;
};

const ROTATE_MS = 4200;

/** GA4 promotion payload for a hero slide (each slide is a merchandising slot). */
function heroPromo(p: HeroProduct, index: number) {
  return {
    promotionId: p.slug,
    promotionName: p.name,
    creativeName: 'hero',
    creativeSlot: `home_hero_${index}`,
    items: [{ item_id: p.slug, item_name: p.name, item_brand: p.brandLine, price: p.price, index }],
  };
}

export function HeroShowcase({ products }: { products: HeroProduct[] }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const count = products.length;

  // Rotation + progress driven by a single rAF loop so the progress bar and the
  // slide advance stay in lock-step, and hover-pause freezes both cleanly (no
  // jump on resume — we keep `last` fresh every frame regardless of pause).
  const progress = useMotionValue(0);
  const activeWidth = useTransform(progress, (v) => `${Math.min(1, Math.max(0, v)) * 100}%`);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (reduceMotion || count <= 1) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current) {
        acc += dt;
        if (acc >= ROTATE_MS) {
          acc = 0;
          setIndex((i) => (i + 1) % count);
        }
        progress.set(acc / ROTATE_MS);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, count, progress]);

  const current = products[index] ?? products[0];

  // GA4 view_promotion — fire when the visible hero slide changes.
  useEffect(() => {
    if (current) analytics.viewPromotion(heroPromo(current, index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.slug]);

  if (count === 0 || !current) return null;

  const goTo = (idx: number) => {
    setIndex(idx);
    progress.set(0);
  };

  const campaign = currentPromotion();

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link
        href={`/products/${current.slug}`}
        onClick={() => analytics.selectPromotion(heroPromo(current, index))}
        data-track="banner"
        data-track-id={current.slug}
        data-track-label={current.name}
        data-index={index}
        className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-brand-pearl shadow-elevated ring-1 ring-border/40 transition-shadow duration-500 ease-editorial hover:shadow-luxe"
      >
        {/* Every slide stays mounted; slides crossfade via opacity. Keying the
            active slide instead would remount (and re-decode) the image on
            every rotation. */}
        {products.map((p, idx) => (
          <motion.div
            key={p.slug}
            initial={false}
            animate={
              reduceMotion
                ? { opacity: idx === index ? 1 : 0 }
                : { opacity: idx === index ? 1 : 0, scale: idx === index ? 1 : 1.05 }
            }
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            aria-hidden={idx !== index}
          >
            <Image
              src={p.imageUrl}
              alt={p.name}
              fill
              priority={idx === 0}
              sizes="(min-width:1024px) 50vw, 100vw"
              className="duration-[1.2s] object-cover transition-transform ease-editorial group-hover:scale-[1.03]"
            />
          </motion.div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-brand-noir/55 via-transparent to-transparent" />

        {/* Festive corner ribbon while the sale campaign runs. */}
        {campaign ? (
          <div className="pointer-events-none absolute right-[-40px] top-[24px] z-10 w-[160px] rotate-45 bg-[#0a4b32] py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-champagne shadow-md ring-1 ring-brand-gold/40">
            {campaign.phase === 'live' ? `${campaign.promo.percentOff}% Off` : 'Azadi Sale'}
          </div>
        ) : null}

        {/* Floating shoppable card. aria-live announces the rotating slide to
            screen readers without them having to watch the carousel. */}
        <div
          aria-live="polite"
          className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-background/70 p-3 backdrop-blur-md transition-transform duration-500 ease-editorial group-hover:-translate-y-0.5"
        >
          <div className="min-w-0">
            {current.brandLine ? (
              <span className="block truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {current.brandLine}
              </span>
            ) : null}
            <span className="block truncate font-serif text-base font-light">{current.name}</span>
            <Price amount={current.price} currency="PKR" />
          </div>
          <span className="shrink-0 rounded-full bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-background transition-colors duration-300 group-hover:bg-brand-rosegold group-hover:text-brand-noir">
            Shop
          </span>
        </div>
      </Link>

      {count > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {products.map((p, idx) => (
            <button
              key={p.slug}
              type="button"
              aria-label={`Show ${p.name}`}
              aria-current={idx === index}
              onClick={() => goTo(idx)}
              className="group h-1.5 w-8 overflow-hidden rounded-full bg-border/80 transition-colors hover:bg-border"
            >
              {idx === index ? (
                reduceMotion ? (
                  <span className="block h-full w-full rounded-full bg-brand-rosegold" />
                ) : (
                  <motion.span
                    className="block h-full rounded-full bg-brand-rosegold"
                    style={{ width: activeWidth }}
                  />
                )
              ) : (
                <span
                  className={cn(
                    'block h-full rounded-full bg-brand-rosegold transition-all duration-500 ease-editorial',
                    idx < index ? 'w-full opacity-100' : 'w-0 opacity-0',
                  )}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
