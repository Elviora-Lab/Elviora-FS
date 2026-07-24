'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';

import { routes } from '@/config/routes';

import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/cn';

import { Price } from '@/design-system/primitives/price';
import { Rating } from '@/design-system/primitives/rating';
import { PromoBadge } from '@/components/promo/promo-badge';
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
};

export function ProductCard({
  product,
  onWishlistToggle,
  wishlisted,
  priority,
  className,
  listId,
  listName,
  index,
}: ProductCardProps) {
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
      className={cn('group relative flex flex-col gap-3', className)}
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
        className="relative block aspect-[3/4] overflow-hidden rounded-md bg-gradient-pearl"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
          />
        ) : (
          // Placeholder when no image is attached — keeps the editorial layout
          // intact and avoids `<Image src="">` warnings.
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center font-serif text-3xl font-light uppercase tracking-[0.2em] text-brand-charcoal/30"
          >
            Elviora
          </span>
        )}
        {product.hoverImageUrl ? (
          <Image
            src={product.hoverImageUrl}
            alt=""
            fill
            sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-500 ease-editorial group-hover:opacity-100"
            aria-hidden
          />
        ) : null}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <PromoBadge />
          {product.isNew ? <Badge variant="gold">New</Badge> : null}
          {product.isBestseller ? <Badge variant="muted">Bestseller</Badge> : null}
        </div>

        {onWishlistToggle ? (
          <WishlistButton wishlisted={wishlisted} onToggle={() => onWishlistToggle(product.id)} />
        ) : null}
      </Link>

      <div className="flex flex-col gap-1">
        {product.brandLine ? <span className="eyebrow">{product.brandLine}</span> : null}
        <Link
          href={routes.productDetail(product.slug)}
          onClick={trackSelect}
          className="font-serif text-base font-light leading-snug decoration-1 underline-offset-4 hover:underline"
        >
          {product.name}
        </Link>
        {typeof product.rating === 'number' ? (
          <Rating value={product.rating} reviewCount={product.reviewCount} />
        ) : null}
        <Price
          amount={product.price}
          compareAt={product.compareAt}
          currency={product.currency}
          className="mt-1"
          showSavings
        />
      </div>
    </article>
  );
}

/**
 * Wishlist heart with three improvements over the previous CSS-only version:
 *  - Visible at rest on touch devices (no hover state on phones).
 *  - Subtle tap pulse for tactile feedback.
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
      whileTap={prefersReduced ? undefined : { scale: 0.88 }}
      // Override the card's product tracking so a wishlist tap logs as its own CTA.
      data-track="cta"
      data-track-label="wishlist-toggle"
      className={cn(
        'absolute right-3 top-3 grid size-9 place-items-center rounded-full',
        'border border-border bg-background/85 backdrop-blur-md',
        // Always visible on touch; hover-revealed on lg+.
        'opacity-100 lg:opacity-0 lg:group-hover:opacity-100',
        'transition-opacity duration-300',
        'focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        wishlisted && 'lg:opacity-100',
      )}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={!!wishlisted}
    >
      <Heart
        className={cn(
          'size-4 transition-colors',
          wishlisted ? 'fill-destructive text-destructive' : 'text-foreground/70',
        )}
      />
    </motion.button>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="shimmer aspect-[3/4] rounded-md bg-muted/60" />
      <div className="shimmer h-3 w-20 rounded bg-muted/60" />
      <div className="shimmer h-4 w-3/4 rounded bg-muted/60" />
      <div className="shimmer h-4 w-1/3 rounded bg-muted/60" />
    </div>
  );
}
