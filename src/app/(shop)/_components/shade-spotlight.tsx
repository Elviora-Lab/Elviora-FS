'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/cn';

import { Button } from '@/components/ui/button';

import type { ShadeSpotlight } from './homepage-modules.data';

export function ShadeSpotlight({ product }: { product: NonNullable<ShadeSpotlight> }) {
  const [active, setActive] = useState(0);
  const shade = product.shades[active] ?? product.shades[0]!;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      {/* Live-swapping product image */}
      <div className="relative order-1 aspect-square w-full overflow-hidden rounded-xl bg-muted">
        <Image
          key={shade.id}
          src={shade.imageUrl}
          alt={`${product.name} — ${shade.name}`}
          fill
          sizes="(min-width:1024px) 45vw, 100vw"
          className="animate-fade-in object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-noir/20 to-transparent" />
        <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-foreground shadow-soft backdrop-blur">
          <span
            aria-hidden
            className="size-3 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: shade.hex }}
          />
          {shade.name}
        </span>
      </div>

      {/* Swatches + detail */}
      <div className="order-2 flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Now showing</p>
          <h3 className="mt-1 font-serif text-3xl font-light md:text-4xl">{shade.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.name} ·{' '}
            <span className="tabular-nums">Rs {shade.price.toLocaleString('en-US')}</span>
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {product.shades.length} shades — tap to preview
          </p>
          <div className="flex flex-wrap gap-2.5">
            {product.shades.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={s.name}
                aria-pressed={i === active}
                title={s.name}
                className={cn(
                  'size-9 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  i === active && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
                )}
                style={{ backgroundColor: s.hex }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="gold" uppercase>
            <Link href={`/products/${product.slug}`}>Shop this shade</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/products">View all colour</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
