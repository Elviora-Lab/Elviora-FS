'use client';

import { cn } from '@/lib/cn';

import { ProductCard, ProductCardSkeleton } from '@/design-system/patterns/product-card';
import { EmptyState } from '@/design-system/primitives/empty-state';

import type { Product } from '../types';

type ProductGridProps = {
  products?: Product[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
  onWishlistToggle?: (id: string) => void;
  wishlistedIds?: string[];
};

export function ProductGrid({
  products,
  loading,
  skeletonCount = 8,
  className,
  onWishlistToggle,
  wishlistedIds = [],
}: ProductGridProps) {
  if (loading && !products) {
    return (
      <div
        className={cn('grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4', className)}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="Nothing to show — yet"
        description="Try adjusting your filters or browse our latest editorial picks."
      />
    );
  }

  return (
    <div
      className={cn('grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4', className)}
    >
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          priority={i < 4}
          onWishlistToggle={onWishlistToggle}
          wishlisted={wishlistedIds.includes(p.id)}
        />
      ))}
    </div>
  );
}
