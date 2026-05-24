import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';

import { ProductCard } from '@/design-system/patterns/product-card';
import { EmptyState } from '@/design-system/primitives/empty-state';
import { Button } from '@/components/ui/button';

import { requireUser } from '@/server/auth/guards';
import { wishlistService } from '@/server/services/wishlist.service';

export const metadata = buildMetadata({
  title: 'Wishlist',
  path: '/account/wishlist',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const session = await requireUser();
  const products = await wishlistService.list(session.sub);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="editorial-heading text-display-md">Wishlist</h1>
        <p className="text-sm text-muted-foreground">
          {products.length > 0
            ? `${products.length} saved piece${products.length === 1 ? '' : 's'} — yours to revisit any time.`
            : 'Saved pieces will appear here.'}
        </p>
      </header>

      {products.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Tap the heart on any product to keep it here for later."
          action={
            <Button asChild>
              <Link href="/products">Browse the edit</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
