'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  animate,
  type AnimationPlaybackControls,
  motion,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react';

import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/cn';

import { Price } from '@/design-system/primitives/price';

export type HeroProduct = {
  slug: string;
  name: string;
  imageUrl: string;
  price: number;
  brandLine?: string;
  /** Both are already on `ProductCardData` — no invented fields. */
  compareAt?: number;
  isBestseller?: boolean;
};

const ROTATE_MS = 5200;

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

function discountPct(p: HeroProduct) {
  return typeof p.compareAt === 'number' && p.compareAt > p.price
    ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100)
    : 0;
}

export function HeroShowcase({
  products,
  freeDeliveryAt,
}: {
  products: HeroProduct[];
  /** Threshold owned by the page so the number lives in exactly one place. */
  freeDeliveryAt: number;
}) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const count = products.length;

  // The rotate timer IS the progress bar: one linear animation from 0→1 drives
  // the indicator fill and advances the slide when it completes. Driving it
  // through a motion value (rather than interval + state) means hovering can
  // pause it mid-fill and resume from the same position, and the 60fps fill
  // never re-renders the tree.
  const progress = useMotionValue(0);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (reduceMotion || count <= 1) return;
    progress.set(0);
    const controls = animate(progress, 1, {
      duration: ROTATE_MS / 1000,
      ease: 'linear',
      onComplete: () => setIndex((i) => (i + 1) % count),
    });
    // A slide can change while the pointer is already inside (or a thumbnail
    // click can land mid-hover) — the fresh animation must inherit that state.
    if (pausedRef.current) controls.pause();
    controlsRef.current = controls;
    return () => {
      controls.stop();
      controlsRef.current = null;
    };
  }, [index, reduceMotion, count, progress]);

  function setPaused(paused: boolean) {
    pausedRef.current = paused;
    if (paused) controlsRef.current?.pause();
    else controlsRef.current?.play();
  }

  const current = products[index] ?? products[0];

  // GA4 view_promotion — fire when the visible hero slide changes.
  useEffect(() => {
    if (current) analytics.viewPromotion(heroPromo(current, index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.slug]);

  if (count === 0 || !current) return null;

  const off = discountPct(current);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      // Keyboard users tabbing through the slides get the same reprieve as
      // hover — otherwise focus jumps out from under them mid-read.
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Colour bloom behind the frame. First child so it paints under the
          siblings without a negative z-index (which would sink below the
          section's own background). */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-6 -top-8 size-56 rounded-full bg-brand-ember/25 blur-3xl md:size-72" />
        <div className="absolute -bottom-10 -left-8 size-48 rounded-full bg-brand-teal/25 blur-3xl md:size-64" />
      </div>

      <div className="relative flex flex-col gap-2.5">
        <Link
          href={`/products/${current.slug}`}
          onClick={() => analytics.selectPromotion(heroPromo(current, index))}
          data-track="banner"
          data-track-id={current.slug}
          data-track-label={current.name}
          data-index={index}
          className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-white/70 bg-white shadow-pop sm:aspect-[16/11] lg:aspect-[4/3]"
        >
          {/* Every slide stays mounted; slides crossfade via opacity. Keying the
              active slide instead would remount (and re-decode) the image on
              every rotation. */}
          {products.map((p, idx) => (
            <motion.div
              key={p.slug}
              initial={false}
              // Ken-Burns: the active slide drifts in over the full rotate
              // interval, so the frame is never completely still.
              animate={
                reduceMotion
                  ? { opacity: idx === index ? 1 : 0 }
                  : { opacity: idx === index ? 1 : 0, scale: idx === index ? 1.06 : 1 }
              }
              transition={{
                opacity: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: ROTATE_MS / 1000, ease: 'linear' },
              }}
              className="absolute inset-0"
              aria-hidden={idx !== index}
            >
              <Image
                src={p.imageUrl}
                alt={p.name}
                fill
                priority={idx === 0}
                // Explicit high hint for the LCP slide; the other slides stay
                // lazy so they don't compete with it for bandwidth.
                fetchPriority={idx === 0 ? 'high' : 'auto'}
                loading={idx === 0 ? undefined : 'lazy'}
                sizes="(min-width:1024px) 55vw, 100vw"
                className="object-cover"
              />
            </motion.div>
          ))}

          {/* Two stops: a deep foot so the info card reads, a light head so the
              badges keep contrast against pale product photography. */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/70 via-brand-ink/5 to-brand-ink/20" />

          <div className="absolute left-3 top-3 flex flex-col items-start gap-2 sm:left-4 sm:top-4">
            {off > 0 ? (
              <span className="rounded-full bg-gradient-ember px-3 py-1 text-xs font-bold tracking-wide text-white shadow-card">
                −{off}% off
              </span>
            ) : null}
            {current.isBestseller ? (
              <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-navy shadow-soft">
                Bestseller
              </span>
            ) : null}
          </div>

          {/* Shoppable card. aria-live announces the rotating slide to screen
              readers without them having to watch the carousel. */}
          <div
            aria-live="polite"
            className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/25 bg-background/85 p-3 shadow-elevated backdrop-blur-md sm:inset-x-4 sm:bottom-4 sm:p-4"
          >
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                {current.brandLine ? (
                  <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {current.brandLine}
                  </span>
                ) : null}
                <span className="block truncate font-serif text-lg font-medium leading-snug sm:text-xl">
                  {current.name}
                </span>
                <Price
                  amount={current.price}
                  compareAt={current.compareAt}
                  currency="PKR"
                  size="lg"
                  showSavings
                  className="mt-1"
                />
              </div>
              <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gradient-ember px-4 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-card transition-all duration-300 ease-swift group-hover:brightness-110 sm:px-6 sm:text-sm">
                <span className="hidden sm:inline">Shop now</span>
                <ArrowRight className="size-4 transition-transform duration-300 ease-swift group-hover:translate-x-0.5" />
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-2.5 text-[11px] font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="size-3.5 text-brand-teal" />
                Free delivery over Rs {freeDeliveryAt.toLocaleString('en-US')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-brand-teal" />
                Cash on delivery
              </span>
            </div>
          </div>
        </Link>

        {/* Thumbnail rail doubles as the carousel indicator: numbered, image-led,
            and the active one carries the autoplay progress fill — far more
            legible (and far bigger a tap target) than four dots. */}
        {count > 1 ? (
          <div className="grid auto-cols-fr grid-flow-col gap-2">
            {products.map((p, idx) => (
              <button
                key={p.slug}
                type="button"
                aria-label={`Show ${p.name}`}
                aria-current={idx === index}
                onClick={() => setIndex(idx)}
                className={cn(
                  'group/thumb relative min-h-11 overflow-hidden rounded-xl border-2 bg-white transition-all duration-300 ease-swift',
                  idx === index
                    ? 'border-brand-ember shadow-card'
                    : 'border-transparent opacity-60 hover:opacity-100',
                )}
              >
                <span className="block aspect-[4/3]">
                  <Image
                    src={p.imageUrl}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="120px"
                    className="object-cover"
                  />
                </span>
                <span className="absolute left-1.5 top-1 text-[10px] font-bold tabular-nums text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {/* Only the active thumb mounts the bar — one shared motion
                    value, no per-frame React work. */}
                {idx === index && !reduceMotion ? (
                  <motion.span
                    style={{ scaleX: progress }}
                    className="absolute inset-x-0 bottom-0 h-1 origin-left bg-gradient-ember"
                  />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
