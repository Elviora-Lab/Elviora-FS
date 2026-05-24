import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Admin · Products', noIndex: true });

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="editorial-heading text-display-md">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your catalog — create, edit, archive.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Wire products operations against the admin RTK Query endpoints.
      </div>
    </div>
  );
}
