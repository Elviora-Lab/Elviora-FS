import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Admin · Journal', noIndex: true });

export default function AdminBlogPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="editorial-heading text-display-md">Journal</h1>
        <p className="text-sm text-muted-foreground">Editorial posts powering /blog.</p>
      </header>
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Wire post operations against the admin RTK Query endpoints.
      </div>
    </div>
  );
}
