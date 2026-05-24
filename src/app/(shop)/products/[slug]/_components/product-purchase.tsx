'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useAppDispatch } from '@/store/hooks';
import { openCart } from '@/store/slices/ui-slice';

import { cn } from '@/lib/cn';

import { Price } from '@/design-system/primitives/price';
import { QuantitySelector } from '@/design-system/primitives/quantity-selector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { cartApi } from '@/features/cart/api/cart-api';
import { useCart } from '@/features/cart/hooks/use-cart';

import { addToCart } from '@/server/actions/cart.actions';

type VariantOption = {
  id: string;
  label: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
};

type Props = {
  productId: string;
  variants: VariantOption[];
  comparePrice?: number;
  currency?: string;
  fallbackPrice: number;
  outOfStock: boolean;
};

export function ProductPurchase({
  productId,
  variants,
  comparePrice,
  currency = 'USD',
  fallbackPrice,
  outOfStock,
}: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cart = useCart();
  const [pending, start] = useTransition();

  const firstAvailable = useMemo(
    () => variants.find((v) => v.isActive && v.stockQuantity > 0) ?? variants[0],
    [variants],
  );
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable?.id);
  const [quantity, setQuantity] = useState(1);

  const selected = variants.find((v) => v.id === variantId);
  const currentPrice = selected?.price ?? fallbackPrice;
  const maxForVariant = selected?.stockQuantity ?? 0;
  const canAdd = !!selected && selected.isActive && selected.stockQuantity > 0;

  function handleAdd() {
    if (!selected || !canAdd) return;

    // Optimistic local update so the cart drawer reflects immediately.
    cart.add({
      productId,
      variantId: selected.id,
      slug: '', // server returns the canonical line later via revalidation
      name: selected.label,
      imageUrl: '',
      unitPrice: selected.price,
      currency,
      quantity,
    });

    start(async () => {
      const result = await addToCart({ variantId: selected.id, quantity });
      if (result.success) {
        toast.success('Added to bag');
        dispatch(openCart());
        // Invalidate RTK Query's Cart cache → useGetCartQuery refetches →
        // CartHydrator syncs Redux with the server's canonical state.
        dispatch(cartApi.util.invalidateTags(['Cart']));
        router.refresh();
      } else {
        toast.error(result.message);
        cart.remove(productId, selected.id);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6">
      <Price amount={currentPrice} compareAt={comparePrice} currency={currency} size="lg" />

      {variants.length > 1 ? (
        <div className="flex flex-col gap-2">
          <Label>Choose your variant</Label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const disabled = !v.isActive || v.stockQuantity === 0;
              const active = variantId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => !disabled && setVariantId(v.id)}
                  disabled={disabled}
                  aria-pressed={active}
                  aria-label={disabled ? `${v.label} (out of stock)` : v.label}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground/40',
                    disabled && 'cursor-not-allowed line-through opacity-50',
                  )}
                >
                  <span>{v.label}</span>
                  {disabled ? (
                    <span
                      aria-hidden
                      className="rounded-sm bg-destructive/15 px-1 text-[9px] font-medium tracking-wider text-destructive no-underline"
                    >
                      OUT
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label>Quantity</Label>
        <QuantitySelector
          value={quantity}
          onChange={(n) => setQuantity(Math.min(n, Math.max(1, maxForVariant)))}
          min={1}
          max={Math.max(1, maxForVariant)}
          disabled={!canAdd}
        />
      </div>

      <Button
        size="xl"
        variant="gold"
        uppercase
        loading={pending}
        disabled={!canAdd || outOfStock}
        onClick={handleAdd}
      >
        {outOfStock ? 'Out of stock' : canAdd ? 'Add to bag' : 'Unavailable'}
      </Button>

      <p className="text-xs text-muted-foreground">
        Free shipping on orders over $75 · 30-day returns
      </p>
    </div>
  );
}
