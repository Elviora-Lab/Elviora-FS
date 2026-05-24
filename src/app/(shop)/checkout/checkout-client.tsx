'use client';

import Link from 'next/link';

import { EmptyState } from '@/design-system/primitives/empty-state';
import { Price } from '@/design-system/primitives/price';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useCart } from '@/features/cart/hooks/use-cart';

export function CheckoutClient() {
  const { cart, subtotal, count } = useCart();
  const currency = cart.lines[0]?.currency ?? 'USD';

  if (count === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="Add something you love before heading to checkout."
        action={
          <Button asChild>
            <Link href="/products">Browse the edit</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Shipping address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Address form scaffold — wire to{' '}
            <code className="font-mono text-xs">/api/v1/addresses</code> once the service is
            implemented.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Stripe Elements goes here. Use{' '}
            <code className="font-mono text-xs">createPaymentIntent</code> from{' '}
            <code className="font-mono text-xs">@/server/payments/stripe</code>.
          </CardContent>
        </Card>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-card p-6 lg:sticky lg:top-24">
        <h2 className="font-serif text-2xl font-light">Order summary</h2>
        <ul className="flex flex-col gap-3 text-sm">
          {cart.lines.map((l) => (
            <li key={`${l.productId}-${l.variantId}`} className="flex justify-between gap-2">
              <span className="line-clamp-1 text-muted-foreground">
                {l.name} × {l.quantity}
              </span>
              <Price amount={l.unitPrice * l.quantity} currency={l.currency} size="sm" />
            </li>
          ))}
        </ul>
        <div className="luxe-divider" />
        <div className="flex items-center justify-between">
          <span className="eyebrow">Subtotal</span>
          <Price amount={subtotal} currency={currency} size="lg" />
        </div>
        <p className="text-xs text-muted-foreground">
          Shipping, taxes and discounts calculated on the next step.
        </p>
        <Button size="lg" variant="gold" uppercase className="mt-2">
          Place order
        </Button>
      </aside>
    </div>
  );
}
