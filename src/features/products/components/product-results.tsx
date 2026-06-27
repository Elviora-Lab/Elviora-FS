import { type ProductCardData } from '@/design-system/patterns/product-card';
import { EmptyState } from '@/design-system/primitives/empty-state';

import { ProductCardConnected } from './product-card-connected';

/**
 * Server-rendered product grid. Renders real product cards into the HTML (good
 * for LCP + crawlers); each card hydrates only its wishlist heart.
 */
export function ProductResults({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Nothing to show — yet"
        description="Try adjusting your filters or browse our latest editorial picks."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCardConnected key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
