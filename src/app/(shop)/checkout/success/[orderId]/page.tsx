import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';

import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/utils/format';

import { Price } from '@/design-system/primitives/price';
import { Section } from '@/design-system/primitives/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { PurchaseTracker } from './_purchase-tracker';

import { ordersService } from '@/server/services/orders.service';

export const metadata = buildMetadata({
  title: 'Order placed',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

type Params = Promise<{ orderId: string }>;

export default async function OrderSuccessPage({ params }: { params: Params }) {
  const { orderId } = await params;

  let order;
  try {
    order = await ordersService.getById(orderId);
  } catch {
    notFound();
  }

  return (
    <Section>
      <PurchaseTracker
        orderId={order.id}
        value={Number(order.totalAmount)}
        currency={order.currency}
        items={order.items.reduce((sum, i) => sum + i.quantity, 0)}
        lineItems={order.items.map((i) => ({
          item_id: i.productId ?? i.id,
          item_name: i.productName,
          ...(i.variantName ? { item_variant: i.variantName } : {}),
          price: Number(i.unitPrice),
          quantity: i.quantity,
        }))}
      />
      <div className="container flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-7" />
        </span>
        <span className="eyebrow">Order confirmed</span>
        <h1 className="editorial-heading text-display-lg">Thank you for your order.</h1>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          We&apos;ve received your order. If you gave us an email, a confirmation is on its way —
          please keep your order number for reference.
        </p>

        <Card className="w-full text-left">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Order number
                </div>
                <div className="font-mono text-lg">{order.orderNumber}</div>
              </div>
              <Badge variant="muted">{order.orderStatus}</Badge>
            </div>

            <div className="luxe-divider" />

            <ul className="flex flex-col gap-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {item.productName}
                    {item.variantName ? ` — ${item.variantName}` : ''} × {item.quantity}
                  </span>
                  <Price amount={Number(item.totalPrice)} currency={order.currency} size="sm" />
                </li>
              ))}
            </ul>

            <div className="luxe-divider" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <Price amount={Number(order.subtotal)} currency={order.currency} size="sm" />
            </div>
            {Number(order.discountAmount) > 0 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums">
                  −
                  <Price
                    amount={Number(order.discountAmount)}
                    currency={order.currency}
                    size="sm"
                  />
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <Price amount={Number(order.shippingFee)} currency={order.currency} size="sm" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <Price amount={Number(order.taxAmount)} currency={order.currency} size="sm" />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
              <span className="eyebrow">Total</span>
              <Price amount={Number(order.totalAmount)} currency={order.currency} size="lg" />
            </div>
            <p className="text-xs text-muted-foreground">
              Placed {formatDate(order.createdAt, { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
