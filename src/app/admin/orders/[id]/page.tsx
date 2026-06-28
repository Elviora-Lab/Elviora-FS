import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate, formatMoney } from '@/utils/format';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { CourierCard } from './courier-card';
import { StatusUpdater } from './status-updater';

import { adminOrdersRepo } from '@/server/repositories/admin.repo';
import { isPostExConfigured } from '@/server/shipping/postex';

export const metadata = buildMetadata({ title: 'Admin · Order', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await adminOrdersRepo.findById(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="editorial-heading font-mono text-display-md">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {formatDate(order.createdAt, { dateStyle: 'long' })}
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
        >
          ← All orders
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Unit</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-border/60">
                      <td className="py-3">
                        <div>{item.productName}</div>
                        {item.variantName ? (
                          <div className="text-xs text-muted-foreground">{item.variantName}</div>
                        ) : null}
                      </td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3">
                        {formatMoney(Number(item.unitPrice), order.currency)}
                      </td>
                      <td className="py-3 text-right">
                        {formatMoney(Number(item.totalPrice), order.currency)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border">
                    <td colSpan={3} className="pt-3 text-right text-sm text-muted-foreground">
                      Subtotal
                    </td>
                    <td className="pt-3 text-right">
                      {formatMoney(Number(order.subtotal), order.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right text-sm text-muted-foreground">
                      Shipping
                    </td>
                    <td className="text-right">
                      {formatMoney(Number(order.shippingFee), order.currency)}
                    </td>
                  </tr>
                  {Number(order.discountAmount) > 0 && (
                    <tr>
                      <td colSpan={3} className="text-right text-sm text-muted-foreground">
                        Discount
                      </td>
                      <td className="text-right">
                        −{formatMoney(Number(order.discountAmount), order.currency)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-border">
                    <td colSpan={3} className="pt-2 text-right font-medium">
                      Total
                    </td>
                    <td className="pt-2 text-right font-medium">
                      {formatMoney(Number(order.totalAmount), order.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3 text-sm">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="muted">{h.status}</Badge>
                      {h.note ? (
                        <div className="mt-1 text-xs text-muted-foreground">{h.note}</div>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(h.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Current status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusUpdater orderId={order.id} currentStatus={order.orderStatus} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <CourierCard
                orderId={order.id}
                configured={isPostExConfigured()}
                shipment={
                  order.shipments[0]
                    ? {
                        courierName: order.shipments[0].courierName,
                        trackingNumber: order.shipments[0].trackingNumber,
                      }
                    : null
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {order.user ? (
                <>
                  <div className="font-medium">
                    {order.user.firstName ?? ''} {order.user.lastName ?? ''}
                  </div>
                  <div className="text-muted-foreground">{order.user.email}</div>
                </>
              ) : (
                <span className="text-muted-foreground">Guest checkout</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div>
                <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'muted'}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.payments.length === 0 ? (
                <p className="text-muted-foreground">No payment attempts recorded.</p>
              ) : (
                <ul className="text-xs text-muted-foreground">
                  {order.payments.map((p) => (
                    <li key={p.id}>
                      {p.paymentMethod} — {formatMoney(Number(p.amount), order.currency)} (
                      {p.paymentStatus})
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
