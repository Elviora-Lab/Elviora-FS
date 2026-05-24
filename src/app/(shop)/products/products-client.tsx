'use client';

import { useAppSelector } from '@/store/hooks';

import { ProductFilters } from '@/features/products/components/product-filters';
import { ProductGrid } from '@/features/products/components/product-grid';
import { useProductList } from '@/features/products/hooks/use-product-list';
import { useWishlistToggle } from '@/features/wishlist/use-wishlist-toggle';

export function ProductsClient() {
  const { data, isLoading, isError } = useProductList();
  const wishlistedIds = useAppSelector((s) => s.wishlist.productIds);
  const toggleWishlistItem = useWishlistToggle();

  return (
    <>
      <ProductFilters />
      {isError ? (
        <p className="text-sm text-destructive">Could not load products. Please refresh.</p>
      ) : (
        <ProductGrid
          products={data?.items}
          loading={isLoading}
          wishlistedIds={wishlistedIds}
          onWishlistToggle={toggleWishlistItem}
        />
      )}
    </>
  );
}
