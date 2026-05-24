import { Suspense } from 'react';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section } from '@/design-system/primitives/section';

import { ProductsClient } from './products-client';

export const metadata = buildMetadata({
  title: 'All products',
  description: 'Browse Elviora’s full edit — skincare, makeup, fragrance.',
  path: '/products',
});

export default function ProductsPage() {
  return (
    <Section>
      <div className="container flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="eyebrow">The Edit</span>
          <h1 className="editorial-heading text-display-lg">All products</h1>
        </header>
        <Suspense fallback={<div className="h-12" />}>
          <ProductsClient />
        </Suspense>
      </div>
    </Section>
  );
}
