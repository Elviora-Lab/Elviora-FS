'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';

import { routes } from '@/config/routes';
import { siteConfig } from '@/config/site';

import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/cn';

import { Price } from '@/design-system/primitives/price';
import { Rating } from '@/design-system/primitives/rating';
import { Badge } from '@/components/ui/badge';

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brandLine?: string;
  imageUrl: string;
  hoverImageUrl?: string;
  price: number;
  compareAt?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  /** Optional stock hint — rendered only when the data source provides it. */
  stockState?: 'in' | 'low' | 'out';
};

type ProductCardProps = {
  product: ProductCardData;
  onWishlistToggle?: (productId: string) => void;
  wishlisted?: boolean;
  priority?: boolean;
  className?: string;
  /** Analytics list context — enables GA4 `select_item` when the card is clicked. */
  listId?: string;
  listName?: string;
  index?: number;
  /** 1-based rank stamp (bestseller ledger) — leads the badge stack. */
  rank?: number;
};

/**
 * Kitchenly product card — practical shopping anatomy:
 * white card on a sand image well, discount % up front, rating + stock
 * signals, and a slide-up "View product" bar so the whole card reads as one
 * tap target. Hover lifts the card; the heart pops on toggle.
 */
export function ProductCard({
  product,
  onWishlistToggle,
  wishlisted,
  priority,
  className,
  listId,
  listName,
  index,
  rank,
}: ProductCardProps) {
  const discountPct =
    typeof product.compareAt === 'number' && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0;

  const trackSelect = () =>
    analytics.selectItem({
      listId,
      listName,
      item: {
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brandLine,
        item_list_id: listId,
        item_list_name: listName,
        price: product.price,
        index,
      },
    });

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card',
        'transition-all duration-300 ease-swift hover:-translate-y-1 hover:border-accent/30 hover:shadow-elevated',
        className,
      )}
      // First-party clickstream: any click inside the card resolves to this
      // product via the delegated listener (see @/lib/analytics/clickstream).
      data-track="product"
      data-product-id={product.id}
      data-track-label={product.name}
      {...(typeof index === 'number' ? { 'data-index': index } : {})}
    >
      <Link
        href={routes.productDetail(product.slug)}
        onClick={trackSelect}
        className="relative block aspect-square overflow-hidden bg-white"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-swift group-hover:scale-105"
          />
        ) : (
          // Placeholder when no image is attached — keeps the grid intact and
          // avoids `<Image src="">` warnings.
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center font-serif text-2xl font-medium text-brand-navy/30"
          >
            {siteConfig.name}
          </span>
        )}
        {product.hoverImageUrl ? (
          <Image
            src={product.hoverImageUrl}
            alt=""
            fill
            sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-500 ease-swift group-hover:opacity-100"
            aria-hidden
          />
        ) : null}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {typeof rank === 'number' ? (
            <span className="grid size-9 place-items-center rounded-xl border border-brand-amber/50 bg-brand-amber/20 font-serif text-sm font-bold text-brand-slate shadow-soft backdrop-blur-sm dark:text-brand-amber">
              {String(rank).padStart(2, '0')}
            </span>
          ) : null}
          {discountPct > 0 ? <Badge variant="deal">-{discountPct}%</Badge> : null}
          {product.isNew ? <Badge variant="info">New</Badge> : null}
          {product.isBestseller ? <Badge variant="gold">Bestseller</Badge> : null}
        </div>

        {onWishlistToggle ? (
          <WishlistButton wishlisted={wishlisted} onToggle={() => onWishlistToggle(product.id)} />
        ) : null}

        {/* Slide-up CTA — the card's "add" affordance. Always visible on
            touch (no hover), revealed on pointer devices. */}
        <span
          className={cn(
            'absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-primary/95 py-2.5',
            'text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground backdrop-blur-sm',
            'translate-y-0 lg:translate-y-full lg:transition-transform lg:duration-300 lg:ease-swift lg:group-hover:translate-y-0',
          )}
        >
          View product <ArrowRight className="size-3.5" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.brandLine ? (
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {product.brandLine}
          </span>
        ) : null}
        <Link
          href={routes.productDetail(product.slug)}
          onClick={trackSelect}
          title={product.name}
          className="truncate text-sm font-medium leading-snug text-foreground transition-colors hover:text-accent"
        >
          {product.name}
        </Link>
        {typeof product.rating === 'number' ? (
          <Rating value={product.rating} reviewCount={product.reviewCount} size={13} />
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <Price amount={product.price} compareAt={product.compareAt} currency={product.currency} />
          {product.stockState === 'low' ? (
            <span className="text-[11px] font-medium text-brand-ember">Low stock</span>
          ) : product.stockState === 'out' ? (
            <span className="text-[11px] font-medium text-muted-foreground">Out of stock</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Wishlist heart:
 *  - Visible at rest on touch devices (no hover state on phones).
 *  - Tap pulse + pop-in fill for tactile feedback.
 *  - Visible focus ring for keyboard users.
 */
function WishlistButton({ wishlisted, onToggle }: { wishlisted?: boolean; onToggle: () => void }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      whileTap={prefersReduced ? undefined : { scale: 0.85 }}
      // Override the card's product tracking so a wishlist tap logs as its own CTA.
      data-track="cta"
      data-track-label="wishlist-toggle"
      className={cn(
        'absolute right-3 top-3 grid size-9 place-items-center rounded-full',
        'border border-border bg-background/90 shadow-soft backdrop-blur-md',
        // Always visible on touch; hover-revealed on lg+.
        'opacity-100 lg:opacity-0 lg:group-hover:opacity-100',
        'transition-all duration-300 hover:scale-110',
        'focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        wishlisted && 'lg:opacity-100',
      )}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={!!wishlisted}
    >
      <Heart
        className={cn(
          'size-4 transition-colors',
          wishlisted ? 'animate-pop-in fill-destructive text-destructive' : 'text-foreground/70',
        )}
      />
    </motion.button>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="shimmer aspect-square bg-muted/60" />
      <div className="flex flex-col gap-2 p-4">
        <div className="shimmer h-3 w-20 rounded bg-muted/60" />
        <div className="shimmer h-4 w-3/4 rounded bg-muted/60" />
        <div className="shimmer h-4 w-1/3 rounded bg-muted/60" />
      </div>
    </div>
  );
}
