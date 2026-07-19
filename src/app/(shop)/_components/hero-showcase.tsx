'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

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
  const count = products.length;

  useEffect(() => {
    if (reduceMotion || paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [reduceMotion, paused, count]);

  const current = products[index] ?? products[0];

  // GA4 view_promotion — fire when the visible hero slide changes.
  useEffect(() => {
    if (current) analytics.viewPromotion(heroPromo(current, index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.slug]);

  if (count === 0 || !current) return null;

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
        className="group relative block aspect-square overflow-hidden rounded-2xl border border-border bg-white shadow-elevated"
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
              // Explicit high hint for the LCP slide; the other slides stay
              // lazy so they don't compete with it for bandwidth.
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              loading={idx === 0 ? undefined : 'lazy'}
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/55 via-transparent to-transparent" />

        {/* Floating shoppable card. aria-live announces the rotating slide to
            screen readers without them having to watch the carousel. */}
        <div
          aria-live="polite"
          className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-background/70 p-3 backdrop-blur-md"
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
          <span className="shrink-0 rounded-full bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-background transition group-hover:bg-brand-ember group-hover:text-brand-ink">
            Shop
          </span>
        </div>
      </Link>

      {count > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {products.map((p, idx) => (
            <button
              key={p.slug}
              type="button"
              aria-label={`Show ${p.name}`}
              aria-current={idx === index}
              onClick={() => setIndex(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                idx === index ? 'w-6 bg-brand-ember' : 'w-1.5 bg-border hover:bg-foreground/40',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
