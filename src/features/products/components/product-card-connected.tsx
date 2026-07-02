import { ProductCard, type ProductCardData } from '@/design-system/patterns/product-card';

/**
 * Thin wrapper around the design-system ProductCard. The wishlist heart is
 * intentionally not wired up — customer accounts (and wishlists) are disabled,
 * so cards render without it. Kept as a wrapper so call sites don't change if
 * card-level client behaviour is reintroduced later.
 */
export function ProductCardConnected({
  product,
  priority,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  return <ProductCard product={product} priority={priority} />;
}
