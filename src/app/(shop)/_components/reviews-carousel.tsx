'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

import { cn } from '@/lib/cn';

import type { ShowcaseReview } from './homepage-modules.data';

const ADVANCE_MS = 5500;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-4',
            i < rating ? 'fill-brand-amber text-brand-amber' : 'fill-transparent text-border',
          )}
        />
      ))}
    </div>
  );
}

export function ReviewsCarousel({ reviews }: { reviews: ShowcaseReview[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = reviews.length;

  const go = useCallback((next: number) => setIndex((next + count) % count), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const review = reviews[index]!;

  return (
    <div
      className="relative mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card px-6 py-10 shadow-card sm:px-12">
        <Quote aria-hidden className="absolute right-6 top-6 size-10 text-brand-mist/50" />

        <div
          key={review.id}
          className="flex animate-fade-in flex-col items-center gap-5 text-center"
        >
          <Stars rating={review.rating} />

          {review.title ? (
            <p className="font-serif text-xl font-light md:text-2xl">“{review.title}”</p>
          ) : null}

          <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {review.comment}
          </p>

          <div className="flex items-center gap-3 pt-2">
            {review.productImage ? (
              <Link
                href={`/products/${review.productSlug}`}
                className="relative size-12 shrink-0 overflow-hidden rounded-full ring-1 ring-border"
                aria-label={review.productName}
              >
                <Image
                  src={review.productImage}
                  alt={review.productName}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </Link>
            ) : null}
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {review.author}
                {review.verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-success">
                    <BadgeCheck className="size-3.5" /> Verified
                  </span>
                ) : null}
              </div>
              <Link
                href={`/products/${review.productSlug}`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                on {review.productName}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous review"
            className="absolute -left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-soft transition-colors hover:text-foreground sm:-left-5"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next review"
            className="absolute -right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-soft transition-colors hover:text-foreground sm:-right-5"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="mt-6 flex justify-center">
            {reviews.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to review ${i + 1}`}
                aria-current={i === index}
                className="group grid size-6 place-items-center"
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all',
                    i === index
                      ? 'w-6 bg-foreground'
                      : 'w-1.5 bg-border group-hover:bg-muted-foreground',
                  )}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
