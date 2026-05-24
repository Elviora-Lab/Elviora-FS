import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Admin · Banners', noIndex: true });

export default function AdminBannersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="editorial-heading text-display-md">Banners</h1>
        <p className="text-sm text-muted-foreground">Hero banners and editorial creative.</p>
      </header>
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Wire banner operations against the admin RTK Query endpoints.
      </div>
    </div>
  );
}
