'use client';

import { useAppSelector } from '@/store/hooks';

import { ProductCard, type ProductCardData } from '@/design-system/patterns/product-card';

import { useWishlistToggle } from '@/features/wishlist/use-wishlist-toggle';

/**
 * Wishlist-connected ProductCard. Self-sources wishlist state so a server
 * component can render a grid of cards without threading client handlers
 * through — keeps the design-system ProductCard pure (no feature imports).
 */
export function ProductCardConnected({
  product,
  priority,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const wishlisted = useAppSelector((s) => s.wishlist.productIds.includes(product.id));
  const toggle = useWishlistToggle();
  return (
    <ProductCard
      product={product}
      priority={priority}
      wishlisted={wishlisted}
      onWishlistToggle={toggle}
    />
  );
}
