import { Suspense } from 'react';

import { buildMetadata } from '@/lib/seo/metadata';

import { WishlistClient } from './wishlist-client';

export const metadata = buildMetadata({
  title: 'Wishlist',
  path: '/account/wishlist',
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="editorial-heading text-display-md">Wishlist</h1>
        <p className="text-sm text-muted-foreground">Saved pieces — yours to revisit any time.</p>
      </header>
      <Suspense fallback={<div className="h-64" />}>
        <WishlistClient />
      </Suspense>
    </div>
  );
}
