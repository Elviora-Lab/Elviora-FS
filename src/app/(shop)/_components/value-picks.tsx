'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { routes } from '@/config/routes';

import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/utils/format';

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
 * Above the layout sits the bundle ledger — the actual arithmetic of taking the
 * whole set together. It renders only when the picks are genuinely discounted,
 * so the ember savings number is never a decorative zero.
 *
 * Client component so the supporting rows keep GA4 `select_item` parity with
 * `<ProductCard>`; the first-party clickstream also fires via `data-track`.
 */
export function ValuePicks({ products }: { products: ProductCardData[] }) {
  const picks = products.slice(0, 4);
  if (picks.length === 0) return null;

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <BundleLedger picks={picks} />
      <PicksLayout picks={picks} />
    </div>
  );
}

/** Count-aware arrangement of the picks themselves. */
function PicksLayout({ picks }: { picks: ProductCardData[] }) {
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
          className={cn(
            'group flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl',
            'border border-dashed border-brand-ember/45 px-4 py-3 text-sm font-semibold text-brand-ember',
            'hover:bg-brand-ember/8 transition-colors duration-300 ease-swift hover:border-brand-ember',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ember focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          See all value picks
          <ArrowRight className="size-4 transition-transform duration-300 ease-snappy group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </Link>
      </Reveal>
    </div>
  );
}

/**
 * The price math, stated plainly: what the set lists at, what it costs, and the
 * gap between them in ember. Only rendered when every number is real — no
 * compare-at prices means no ledger rather than a fabricated saving.
 */
function BundleLedger({ picks }: { picks: ProductCardData[] }) {
  const total = picks.reduce((sum, p) => sum + p.price, 0);
  const listTotal = picks.reduce((sum, p) => sum + Math.max(p.compareAt ?? p.price, p.price), 0);
  const saved = listTotal - total;
  if (saved <= 0) return null;

  const savedPct = Math.round((saved / listTotal) * 100);
  const currency = picks[0]?.currency ?? 'PKR';

  return (
    <Reveal inView>
      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl border border-brand-ember/25 bg-brand-ember/5 p-4',
          'shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5',
        )}
      >
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ember">
            <Sparkles aria-hidden className="size-3.5" />
            Popular together
          </span>
          <p className="text-sm text-muted-foreground">
            Shoppers take these {picks.length} as a set — and the set is where the money is.
          </p>
        </div>

        {/* The arithmetic, left to right: list → yours → saved. */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm text-muted-foreground line-through">
            {formatMoney(listTotal, currency)}
          </span>
          <span className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
            {formatMoney(total, currency)}
          </span>
          <Badge variant="deal" className="text-xs">
            Save {formatMoney(saved, currency)} · {savedPct}%
          </Badge>
        </div>
      </div>
    </Reveal>
  );
}

/** Compact horizontal pick — thumbnail, name, price, in the supporting rail. */
function PickRow({ product, index }: { product: ProductCardData; index: number }) {
  const compareAt =
    typeof product.compareAt === 'number' && product.compareAt > product.price
      ? product.compareAt
      : null;
  const saved = compareAt ? compareAt - product.price : 0;
  const discountPct = compareAt ? Math.round((saved / compareAt) * 100) : 0;

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
        'group flex min-h-[44px] flex-1 items-center gap-4 rounded-xl border border-border bg-card p-3',
        'transition-all duration-300 ease-swift hover:-translate-y-0.5 hover:border-brand-ember/35 hover:shadow-elevated',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ember focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <span className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-white">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-500 ease-swift group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
        <span className="truncate text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-brand-ember">
          {product.name}
        </span>
        <Price amount={product.price} compareAt={product.compareAt} currency={product.currency} />
        {saved > 0 ? (
          <span className="text-[11px] font-semibold text-brand-ember">
            You save {formatMoney(saved, product.currency ?? 'PKR')}
          </span>
        ) : null}
      </span>

      <ArrowRight
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground transition-all duration-300 ease-snappy group-hover:translate-x-0.5 group-hover:text-brand-ember motion-reduce:transition-none"
      />
    </Link>
  );
}
