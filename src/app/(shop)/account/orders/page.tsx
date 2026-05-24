import { buildMetadata } from '@/lib/seo/metadata';

import { EmptyState } from '@/design-system/primitives/empty-state';

export const metadata = buildMetadata({ title: 'Orders', path: '/account/orders', noIndex: true });

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="editorial-heading text-display-md">Orders</h1>
        <p className="text-sm text-muted-foreground">History across all your purchases.</p>
      </header>
      {/* Wire to GET /api/v1/orders — see ordersService.listForUser */}
      <EmptyState
        title="No orders yet"
        description="When you place an order, it will appear here."
      />
    </div>
  );
}
