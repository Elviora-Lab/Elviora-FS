import Link from 'next/link';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate, formatMoney } from '@/utils/format';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { adminOrdersRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Orders', noIndex: true });
export const dynamic = 'force-dynamic';

const statusValues = Object.values(OrderStatus);
const filterSchema = z.object({
  status: z.enum(statusValues as [OrderStatus, ...OrderStatus[]]).optional(),
});

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const raw = await searchParams;
  const { status } = filterSchema.parse({ status: raw.status });

  const [items, total] = await adminOrdersRepo.list({ status, take: 100 });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {total} matching — track status, fulfilment, refunds.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant={!status ? 'primary' : 'outline'}>
          <Link href="/admin/orders">All</Link>
        </Button>
        {statusValues.map((s) => (
          <Button key={s} asChild size="sm" variant={status === s ? 'primary' : 'outline'}>
            <Link href={`/admin/orders?status=${s}`}>{s}</Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No orders match this filter.
                  </td>
                </tr>
              ) : (
                items.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                    <td className="px-4 py-3">{o.user?.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">{o.orderStatus}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={o.paymentStatus === 'PAID' ? 'success' : 'muted'}>
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{o._count.items}</td>
                    <td className="px-4 py-3">{formatMoney(Number(o.totalAmount), o.currency)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
