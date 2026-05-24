import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Admin · Analytics', noIndex: true });

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="editorial-heading text-display-md">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Sales, traffic, and merchandising performance.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Wire analytics widgets against the admin RTK Query endpoints.
      </div>
    </div>
  );
}
