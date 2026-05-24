'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

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

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function ProductGrid({
  products,
  loading,
  skeletonCount = 8,
  className,
  onWishlistToggle,
  wishlistedIds = [],
}: ProductGridProps) {
  const prefersReduced = useReducedMotion();

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

  // Cap motion to the first 12 items so very long grids don't stagger painfully
  // far down the page; the rest mount instantly.
  const STAGGER_LIMIT = 12;

  if (prefersReduced) {
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

  return (
    <motion.div
      className={cn('grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4', className)}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {products.map((p, i) => (
        <motion.div key={p.id} variants={i < STAGGER_LIMIT ? item : undefined}>
          <ProductCard
            product={p}
            priority={i < 4}
            onWishlistToggle={onWishlistToggle}
            wishlisted={wishlistedIds.includes(p.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
