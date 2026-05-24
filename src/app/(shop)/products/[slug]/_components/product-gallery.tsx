'use client';

import { useState } from 'react';
import Image from 'next/image';

import { cn } from '@/lib/cn';

type Image = { url: string; alt: string };

export function ProductGallery({ images, productName }: { images: Image[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-gradient-pearl">
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center font-serif text-3xl font-light uppercase tracking-[0.22em] text-brand-charcoal/30"
        >
          Elviora
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-gradient-pearl">
        {active?.url ? (
          <Image
            src={active.url}
            alt={active.alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1} of ${productName}`}
              aria-current={activeIndex === i}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md bg-gradient-pearl transition-all',
                activeIndex === i
                  ? 'ring-2 ring-foreground/60 ring-offset-2 ring-offset-background'
                  : 'opacity-70 hover:opacity-100',
              )}
            >
              <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
