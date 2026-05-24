import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/utils/format';

import { EmptyState } from '@/design-system/primitives/empty-state';
import { Price } from '@/design-system/primitives/price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { requireUser } from '@/server/auth/guards';
import { ordersService } from '@/server/services/orders.service';

export const metadata = buildMetadata({ title: 'Orders', path: '/account/orders', noIndex: true });
export const dynamic = 'force-dynamic';

const STATUS_VARIANT: Record<string, 'muted' | 'success' | 'gold' | 'danger'> = {
  PENDING: 'muted',
  CONFIRMED: 'gold',
  PROCESSING: 'gold',
  SHIPPED: 'gold',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'danger',
  REFUNDED: 'danger',
};

export default async function OrdersPage() {
  const session = await requireUser();
  const { items, total } = await ordersService.listForUser(session.sub, 1, 50);

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <EmptyState
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={
            <Button asChild>
              <Link href="/products">Browse the edit</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header subtitle={`${total} order${total === 1 ? '' : 's'} on file.`} />

      <ul className="flex flex-col gap-3">
        {items.map((order) => {
          const lineCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
          const firstFew = order.items
            .slice(0, 3)
            .map((i) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ''}`)
            .join(', ');
          const more = order.items.length > 3 ? `, +${order.items.length - 3} more` : '';

          return (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="group block transition-shadow hover:shadow-card"
              >
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-4 p-5">
                    <div className="flex min-w-[180px] flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{order.orderNumber}</span>
                        <Badge variant={STATUS_VARIANT[order.orderStatus] ?? 'muted'}>
                          {order.orderStatus}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Placed {formatDate(order.createdAt, { dateStyle: 'medium' })}
                      </span>
                    </div>

                    <div className="line-clamp-1 min-w-[240px] flex-1 text-sm text-muted-foreground">
                      {firstFew}
                      {more}
                    </div>

                    <div className="text-right">
                      <Price
                        amount={Number(order.totalAmount)}
                        currency={order.currency}
                        size="md"
                      />
                      <div className="text-xs text-muted-foreground">
                        {lineCount} item{lineCount === 1 ? '' : 's'}
                      </div>
                    </div>

                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Header({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="editorial-heading text-display-md">Orders</h1>
      <p className="text-sm text-muted-foreground">
        {subtitle ?? 'History across all your purchases.'}
      </p>
    </header>
  );
}
