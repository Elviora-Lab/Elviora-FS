'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { useAppDispatch } from '@/store/hooks';
import { openCart } from '@/store/slices/ui-slice';

import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/cn';

import { Price } from '@/design-system/primitives/price';
import { QuantitySelector } from '@/design-system/primitives/quantity-selector';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RichText } from '@/components/ui/rich-text';

import { cartApi } from '@/features/cart/api/cart-api';
import { useCart } from '@/features/cart/hooks/use-cart';

import { BackInStockNotify } from './back-in-stock-notify';

import { addToCart } from '@/server/actions/cart.actions';

export type GalleryImage = { url: string; alt: string; variantId: string | null };
export type VariantOption = {
  id: string;
  name: string;
  hex?: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
};
export type IngredientItem = { id: string; name: string; description?: string | null };

type Props = {
  productId: string;
  productName: string;
  brandName?: string;
  brandSlug?: string;
  shortDescription?: string;
  fullDescription?: string;
  skinConcerns: { id: string; name: string }[];
  ingredients: IngredientItem[];
  images: GalleryImage[];
  variants: VariantOption[];
  comparePrice?: number;
  currency?: string;
  fallbackPrice: number;
  outOfStock: boolean;
};

export function ProductExperience({
  productId,
  productName,
  brandName,
  brandSlug,
  shortDescription,
  fullDescription,
  skinConcerns,
  ingredients,
  images,
  variants,
  comparePrice,
  currency = 'PKR',
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
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = images.findIndex((im) => im.variantId === firstAvailable?.id);
    return idx >= 0 ? idx : 0;
  });

  const selected = variants.find((v) => v.id === variantId);
  const currentPrice = selected?.price ?? fallbackPrice;
  const maxForVariant = selected?.stockQuantity ?? 0;
  const canAdd = !!selected && selected.isActive && selected.stockQuantity > 0;

  const total = images.length;
  const active = images[activeIndex];
  const go = (dir: 1 | -1) => setActiveIndex((i) => (i + dir + total) % total);

  // Analytics: fire a product view once per product (Meta ViewContent + GA4 view_item).
  useEffect(() => {
    analytics.viewItem({ id: productId, name: productName, price: currentPrice, currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function selectVariant(id: string) {
    setVariantId(id);
    const idx = images.findIndex((im) => im.variantId === id);
    if (idx >= 0) setActiveIndex(idx);
  }

  function handleAdd() {
    if (!selected || !canAdd) return;
    cart.add({
      productId,
      variantId: selected.id,
      slug: '',
      name: selected.name,
      imageUrl: active?.url ?? '',
      unitPrice: selected.price,
      currency,
      quantity,
    });
    analytics.addToCart({
      id: productId,
      name: selected.name,
      quantity,
      price: selected.price,
      currency,
    });
    start(async () => {
      const result = await addToCart({ variantId: selected.id, quantity });
      if (result.success) {
        toast.success('Added to bag');
        dispatch(openCart());
        dispatch(cartApi.util.invalidateTags(['Cart']));
        router.refresh();
      } else {
        toast.error(result.message);
        cart.remove(productId, selected.id);
      }
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Gallery — one image at a time */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-gradient-pearl">
        {active?.url ? (
          <Image
            key={active.url}
            src={active.url}
            alt={active.alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-contain"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center font-serif text-3xl font-light uppercase tracking-[0.22em] text-brand-charcoal/30"
          >
            Elviora
          </span>
        )}

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow-soft backdrop-blur transition hover:bg-background"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow-soft backdrop-blur transition hover:bg-background"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2.5 py-1 text-xs tabular-nums text-foreground backdrop-blur">
              {activeIndex + 1} / {total}
            </div>
          </>
        ) : null}
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {brandName ? (
              brandSlug ? (
                <Link
                  href={`/brands/${brandSlug}`}
                  className="eyebrow w-fit transition-colors hover:text-foreground"
                >
                  {brandName}
                </Link>
              ) : (
                <span className="eyebrow">{brandName}</span>
              )
            ) : null}
            <h1 className="editorial-heading text-display-md md:text-display-lg">{productName}</h1>
            {shortDescription ? (
              <p className="text-pretty leading-relaxed text-muted-foreground">
                {shortDescription}
              </p>
            ) : null}
          </div>
          {skinConcerns.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {skinConcerns.map((c) => (
                <Badge key={c.id} variant="outline">
                  {c.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6">
          <Price amount={currentPrice} compareAt={comparePrice} currency={currency} size="lg" />

          {variants.length > 1 ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between">
                <Label>Choose your variant</Label>
                {selected ? (
                  <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    {selected.name}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const disabled = !v.isActive || v.stockQuantity === 0;
                  const isActive = variantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => !disabled && selectVariant(v.id)}
                      disabled={disabled}
                      title={disabled ? `${v.name} (out of stock)` : v.name}
                      aria-label={v.name}
                      aria-pressed={isActive}
                      className={cn(
                        'relative grid size-8 place-items-center overflow-hidden rounded-full border transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isActive
                          ? 'border-transparent ring-2 ring-foreground ring-offset-2 ring-offset-card'
                          : 'border-border/60 hover:scale-110',
                        disabled && 'cursor-not-allowed opacity-40',
                      )}
                      style={v.hex ? { backgroundColor: v.hex } : undefined}
                    >
                      {!v.hex ? (
                        <span className="text-[8px] font-medium uppercase text-muted-foreground">
                          {v.name.slice(0, 3)}
                        </span>
                      ) : null}
                      {disabled ? (
                        <span
                          aria-hidden
                          className="absolute inset-0 grid place-items-center text-base text-foreground/70"
                        >
                          ⁄
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

          {selected && !canAdd ? (
            <BackInStockNotify key={selected.id} variantId={selected.id} />
          ) : null}

          <p className="text-xs text-muted-foreground">
            Free shipping on orders over Rs 8,000 · 30-day returns
          </p>
        </div>

        <Accordion type="multiple" defaultValue={['description']} className="mt-2">
          <AccordionItem value="description">
            <AccordionTrigger>Description</AccordionTrigger>
            <AccordionContent>
              {fullDescription || shortDescription ? (
                <RichText text={fullDescription ?? shortDescription ?? ''} />
              ) : (
                'No description yet.'
              )}
            </AccordionContent>
          </AccordionItem>

          {ingredients.length > 0 ? (
            <AccordionItem value="ingredients">
              <AccordionTrigger>Hero ingredients</AccordionTrigger>
              <AccordionContent>
                <ul className="flex flex-col gap-2">
                  {ingredients.map((ing) => (
                    <li key={ing.id}>
                      <span className="font-medium text-foreground">{ing.name}</span>
                      {ing.description ? (
                        <span className="text-muted-foreground"> — {ing.description}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          <AccordionItem value="shipping">
            <AccordionTrigger>Shipping &amp; returns</AccordionTrigger>
            <AccordionContent>
              Complimentary shipping on orders over Rs 8,000. Free 30-day returns on all unopened
              products.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
