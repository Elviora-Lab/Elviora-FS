import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Admin · Users', noIndex: true });

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="editorial-heading text-display-md">Users</h1>
        <p className="text-sm text-muted-foreground">Customer accounts, roles, segments.</p>
      </header>
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Wire user operations against the admin RTK Query endpoints.
      </div>
    </div>
  );
}
