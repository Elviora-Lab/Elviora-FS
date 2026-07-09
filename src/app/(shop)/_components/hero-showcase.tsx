'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

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
        className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-brand-pearl shadow-elevated"
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={current.slug}
            initial={reduceMotion ? false : { opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={current.imageUrl}
              alt={current.name}
              fill
              priority={index === 0}
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-brand-noir/55 via-transparent to-transparent" />

        {/* Floating shoppable card */}
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-background/70 p-3 backdrop-blur-md">
          <div className="min-w-0">
            {current.brandLine ? (
              <span className="block truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {current.brandLine}
              </span>
            ) : null}
            <span className="block truncate font-serif text-base font-light">{current.name}</span>
            <Price amount={current.price} currency="PKR" />
          </div>
          <span className="shrink-0 rounded-full bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-background transition group-hover:bg-brand-rosegold group-hover:text-brand-noir">
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
                idx === index ? 'w-6 bg-brand-rosegold' : 'w-1.5 bg-border hover:bg-foreground/40',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
