import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Admin · Orders', noIndex: true });

export default function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="editorial-heading text-display-md">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Order operations — fulfill, refund, annotate.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Wire orders operations against the admin RTK Query endpoints.
      </div>
    </div>
  );
}
