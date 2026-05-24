import { buildMetadata } from '@/lib/seo/metadata';

import { EmptyState } from '@/design-system/primitives/empty-state';

export const metadata = buildMetadata({
  title: 'Addresses',
  path: '/account/addresses',
  noIndex: true,
});

export default function AddressesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="editorial-heading text-display-md">Addresses</h1>
        <p className="text-sm text-muted-foreground">Saved shipping and billing destinations.</p>
      </header>
      {/* Wire to GET /api/v1/addresses once the route is implemented. */}
      <EmptyState
        title="No addresses on file"
        description="Add one at checkout — it will appear here for next time."
      />
    </div>
  );
}
