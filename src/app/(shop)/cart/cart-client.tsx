'use client';

import Image from 'next/image';
import Link from 'next/link';

import { EmptyState } from '@/design-system/primitives/empty-state';
import { Price } from '@/design-system/primitives/price';
import { QuantitySelector } from '@/design-system/primitives/quantity-selector';
import { Button } from '@/components/ui/button';

import { useRemoveCartLineMutation, useUpdateCartLineMutation } from '@/features/cart/api/cart-api';
import { useCart } from '@/features/cart/hooks/use-cart';

export function CartPageClient() {
  const { cart, subtotal, count, updateQty, remove } = useCart();
  const [updateLine] = useUpdateCartLineMutation();
  const [removeLineMutation] = useRemoveCartLineMutation();

  function handleUpdateQty(line: { id?: string; productId: string; variantId: string }, q: number) {
    updateQty(line.productId, line.variantId, q);
    if (line.id)
      updateLine({ lineId: line.id, quantity: q })
        .unwrap()
        .catch(() => undefined);
  }

  function handleRemove(line: { id?: string; productId: string; variantId: string }) {
    remove(line.productId, line.variantId);
    if (line.id)
      removeLineMutation({ lineId: line.id })
        .unwrap()
        .catch(() => undefined);
  }

  if (count === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="When you find something you love, it will appear here."
        action={
          <Button asChild>
            <Link href="/products">Browse the edit</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <ul className="flex flex-col divide-y divide-border">
        {cart.lines.map((line) => (
          <li key={`${line.productId}-${line.variantId}`} className="flex gap-6 py-6">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-md bg-gradient-pearl">
              {line.imageUrl ? (
                <Image
                  src={line.imageUrl}
                  alt={line.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="absolute inset-0 grid place-items-center font-serif text-[10px] uppercase tracking-[0.2em] text-brand-charcoal/30"
                >
                  Elviora
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Link
                href={`/products/${line.slug}`}
                className="font-serif text-lg font-light underline-offset-4 hover:underline"
              >
                {line.name}
              </Link>
              <Price amount={line.unitPrice} currency={line.currency} />
              <div className="mt-auto flex items-center justify-between">
                <QuantitySelector
                  value={line.quantity}
                  onChange={(q) => handleUpdateQty(line, q)}
                />
                <button
                  type="button"
                  onClick={() => handleRemove(line)}
                  className="text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-card p-6 lg:sticky lg:top-24">
        <h2 className="font-serif text-2xl font-light">Order summary</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <Price amount={subtotal} currency={cart.lines[0]?.currency ?? 'USD'} />
        </div>
        <p className="text-xs text-muted-foreground">
          Shipping, taxes and discounts calculated at checkout.
        </p>
        <Button asChild size="lg" variant="gold" uppercase>
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
      </aside>
    </div>
  );
}
