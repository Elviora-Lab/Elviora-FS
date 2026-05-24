'use client';

import { useAppSelector } from '@/store/hooks';

import { useListProductsQuery } from '@/features/products/api/products-api';
import { ProductFilters } from '@/features/products/components/product-filters';
import { ProductGrid } from '@/features/products/components/product-grid';
import { useWishlistToggle } from '@/features/wishlist/use-wishlist-toggle';

export function CategoryProducts({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useListProductsQuery({ category: slug });
  const wishlistedIds = useAppSelector((s) => s.wishlist.productIds);
  const toggleWishlistItem = useWishlistToggle();

  return (
    <div className="flex flex-col gap-6">
      <ProductFilters />
      {isError ? (
        <p className="text-sm text-destructive">Could not load this category. Please refresh.</p>
      ) : (
        <ProductGrid
          products={data?.items}
          loading={isLoading}
          wishlistedIds={wishlistedIds}
          onWishlistToggle={toggleWishlistItem}
        />
      )}
    </div>
  );
}
