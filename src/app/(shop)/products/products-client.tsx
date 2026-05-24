'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { ProductFilters } from '@/features/products/components/product-filters';
import { ProductGrid } from '@/features/products/components/product-grid';
import { useProductList } from '@/features/products/hooks/use-product-list';
import { wishlistActions } from '@/features/wishlist/wishlist-slice';

export function ProductsClient() {
  const { data, isLoading, isError } = useProductList();
  const dispatch = useAppDispatch();
  const wishlistedIds = useAppSelector((s) => s.wishlist.productIds);

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
          onWishlistToggle={(id) => dispatch(wishlistActions.toggle(id))}
        />
      )}
    </>
  );
}
