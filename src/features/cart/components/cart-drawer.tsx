'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeCart, toggleCart } from '@/store/slices/ui-slice';

import { EmptyState } from '@/design-system/primitives/empty-state';
import { Price } from '@/design-system/primitives/price';
import { QuantitySelector } from '@/design-system/primitives/quantity-selector';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { useRemoveCartLineMutation, useUpdateCartLineMutation } from '../api/cart-api';
import { useCart } from '../hooks/use-cart';

export function CartDrawerTrigger() {
  const count = useCart().count;
  const dispatch = useAppDispatch();
  return (
    <button
      type="button"
      onClick={() => dispatch(toggleCart())}
      className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-muted"
      aria-label={`Open cart (${count} items)`}
    >
      <ShoppingBag className="size-5" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1.5 text-[10px] font-medium tabular-nums text-background">
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function CartDrawer() {
  const open = useAppSelector((s) => s.ui.cartOpen);
  const dispatch = useAppDispatch();
  const { cart, subtotal, count, updateQty, remove } = useCart();
  const [updateLine] = useUpdateCartLineMutation();
  const [removeLineMutation] = useRemoveCartLineMutation();

  function handleUpdateQty(line: { id?: string; productId: string; variantId: string }, q: number) {
    // Optimistic Redux update for instant feedback.
    updateQty(line.productId, line.variantId, q);
    // Persist server-side. Skip if we don't yet have a DB id (line was just
    // added optimistically — CartHydrator will catch up on the next refetch).
    if (line.id) {
      updateLine({ lineId: line.id, quantity: q })
        .unwrap()
        .catch(() => {
          // Mutation invalidates Cart tag on failure too; the next refetch
          // re-hydrates Redux to the server's truth.
        });
    }
  }

  function handleRemove(line: { id?: string; productId: string; variantId: string }) {
    remove(line.productId, line.variantId);
    if (line.id) {
      removeLineMutation({ lineId: line.id })
        .unwrap()
        .catch(() => undefined);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? null : dispatch(closeCart()))}>
      <SheetTrigger asChild>
        <span />
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your shopping bag</SheetTitle>
          <SheetDescription>
            {count > 0
              ? `${count} item${count === 1 ? '' : 's'} — complimentary samples included.`
              : 'Your bag is currently empty.'}
          </SheetDescription>
        </SheetHeader>

        <div className="my-6 flex-1 overflow-y-auto pr-1">
          {cart.lines.length === 0 ? (
            <EmptyState
              title="Bag is empty"
              description="Discover our editorial picks and start your ritual."
              action={
                <Button asChild>
                  <Link href="/products" onClick={() => dispatch(closeCart())}>
                    Browse products
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-5">
              {cart.lines.map((line) => (
                <li key={`${line.productId}-${line.variantId}`} className="flex gap-4">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-gradient-pearl">
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt={line.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="absolute inset-0 grid place-items-center font-serif text-[9px] uppercase tracking-[0.2em] text-brand-charcoal/30"
                      >
                        Elviora
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={() => dispatch(closeCart())}
                      className="font-serif text-base font-light underline-offset-4 hover:underline"
                    >
                      {line.name}
                    </Link>
                    <Price amount={line.unitPrice} currency={line.currency} size="sm" />
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
          )}
        </div>

        {cart.lines.length > 0 ? (
          <SheetFooter className="flex-col gap-4 sm:flex-col sm:items-stretch">
            <div className="flex items-center justify-between text-sm">
              <span className="eyebrow">Subtotal</span>
              <Price amount={subtotal} currency={cart.lines[0]?.currency ?? 'PKR'} size="lg" />
            </div>
            <p className="text-balance text-xs text-muted-foreground">
              Shipping, taxes and discounts calculated at checkout.
            </p>
            <Button asChild size="lg" variant="gold" uppercase>
              <Link href="/checkout" onClick={() => dispatch(closeCart())}>
                Checkout
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/cart" onClick={() => dispatch(closeCart())}>
                View bag
              </Link>
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
