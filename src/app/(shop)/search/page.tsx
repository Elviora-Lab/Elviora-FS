import { Suspense } from 'react';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section } from '@/design-system/primitives/section';

import { SearchClient } from './search-client';

export const metadata = buildMetadata({
  title: 'Search',
  description: 'Search Elviora — skincare, makeup, fragrance.',
  path: '/search',
  noIndex: true,
});

export default function SearchPage() {
  return (
    <Section>
      <div className="container flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="eyebrow">Search</span>
          <h1 className="editorial-heading text-display-lg">Find your next ritual</h1>
        </header>
        <Suspense fallback={<div className="h-64" />}>
          <SearchClient />
        </Suspense>
      </div>
    </Section>
  );
}
