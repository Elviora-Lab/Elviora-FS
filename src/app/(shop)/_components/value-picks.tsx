'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { routes } from '@/config/routes';

import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/cn';

import { ProductCard, type ProductCardData } from '@/design-system/patterns/product-card';
import { Price } from '@/design-system/primitives/price';
import { Reveal } from '@/design-system/primitives/reveal';
import { Badge } from '@/components/ui/badge';

const LIST_ID = 'home_bundles';
const LIST_NAME = 'Home — Bundles';

/**
 * "Picks that pull their weight" — the value-bundle showcase.
 *
 * The catalog rarely has exactly four bundles, so the layout is count-aware
 * rather than a fixed grid with a forced `col-span` hero (which left dead space
 * and mismatched heights whenever fewer than four picks existed):
 *   • 1–2 picks → balanced, generously-sized cards.
 *   • 3–4 picks → a spotlight hero beside a compact supporting rail.
 *
 * Client component so the supporting rows keep GA4 `select_item` parity with
 * `<ProductCard>`; the first-party clickstream also fires via `data-track`.
 */
export function ValuePicks({ products }: { products: ProductCardData[] }) {
  const picks = products.slice(0, 4);
  if (picks.length === 0) return null;

  // 1–2 picks: equal cards. A lone pick stays centered so it never floats in a
  // half-empty row.
  if (picks.length <= 2) {
    return (
      <div
        className={cn(
          'grid gap-4 md:gap-5',
          picks.length === 1 ? 'mx-auto max-w-md' : 'sm:grid-cols-2',
        )}
      >
        {picks.map((p, i) => (
          <Reveal key={p.id} inView delay={i * 0.08} className="h-full">
            <ProductCard
              product={p}
              listId={LIST_ID}
              listName={LIST_NAME}
              index={i}
              className="h-full"
            />
          </Reveal>
        ))}
      </div>
    );
  }

  // 3–4 picks: spotlight + rail. The rail rows stretch (flex-1) so they fill the
  // hero's height, and a "see all" cap closes the column.
  const [featured, ...rest] = picks;
  if (!featured) return null;
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Reveal inView className="h-full">
        <ProductCard
          product={featured}
          listId={LIST_ID}
          listName={LIST_NAME}
          index={0}
          className="lg:h-full"
        />
      </Reveal>
      <Reveal inView delay={0.1} className="flex flex-col gap-3">
        {rest.map((p, i) => (
          <PickRow key={p.id} product={p} index={i + 1} />
        ))}
        <Link
          href={routes.category('best-selling')}
          data-track="cta"
          data-track-label="value-picks-see-all"
          className="group flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-accent/40 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/5"
        >
          See all value picks
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Reveal>
    </div>
  );
}

/** Compact horizontal pick — thumbnail, name, price, in the supporting rail. */
function PickRow({ product, index }: { product: ProductCardData; index: number }) {
  const discountPct =
    typeof product.compareAt === 'number' && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0;

  const trackSelect = () =>
    analytics.selectItem({
      listId: LIST_ID,
      listName: LIST_NAME,
      item: {
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brandLine,
        item_list_id: LIST_ID,
        item_list_name: LIST_NAME,
        price: product.price,
        index,
      },
    });

  return (
    <Link
      href={routes.productDetail(product.slug)}
      onClick={trackSelect}
      data-track="product"
      data-product-id={product.id}
      data-track-label={product.name}
      data-index={index}
      className={cn(
        'group flex flex-1 items-center gap-4 rounded-xl border border-border bg-card p-3',
        'transition-all duration-300 ease-swift hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-elevated',
      )}
    >
      <span className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-white">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-500 ease-swift group-hover:scale-105"
          />
        ) : null}
        {discountPct > 0 ? (
          <Badge variant="deal" className="absolute left-1 top-1 px-1.5 py-0 text-[10px]">
            -{discountPct}%
          </Badge>
        ) : null}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {product.brandLine ? (
          <span className="truncate text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {product.brandLine}
          </span>
        ) : null}
        <span className="truncate text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
          {product.name}
        </span>
        <Price amount={product.price} compareAt={product.compareAt} currency={product.currency} />
      </span>

      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
    </Link>
  );
}
