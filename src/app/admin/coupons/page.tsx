import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Admin · Coupons', noIndex: true });

export default function AdminCouponsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="editorial-heading text-display-md">Coupons</h1>
        <p className="text-sm text-muted-foreground">
          Promotional codes and campaign-level discounts.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Wire coupon operations against the admin RTK Query endpoints.
      </div>
    </div>
  );
}
