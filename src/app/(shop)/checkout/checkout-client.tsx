'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useAppSelector } from '@/store/hooks';

import { cn } from '@/lib/cn';

import { EmptyState } from '@/design-system/primitives/empty-state';
import { Price } from '@/design-system/primitives/price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useCart } from '@/features/cart/hooks/use-cart';
import { selectCart } from '@/features/cart/store/cart-slice';

import { placeOrder } from '@/server/actions/checkout.actions';

type Address = {
  id: string;
  fullName: string;
  phone: string | null;
  country: string;
  city: string;
  area: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string | null;
  isDefault: boolean;
};

type CartProp = {
  lines: Array<{
    productId: string;
    variantId: string | null;
    name: string;
    unitPrice: number;
    quantity: number;
    currency: string;
  }>;
  subtotal: number;
  currency: string;
};

type PaymentMethod = 'COD' | 'CARD' | 'BANK_TRANSFER';

export function CheckoutClient({
  addresses,
  cart,
  stripeEnabled,
}: {
  addresses: Address[];
  cart: CartProp;
  stripeEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { clear: clearLocalCart, cart: clientCart } = useCart();
  const { couponCode, couponDiscount } = useAppSelector(selectCart);
  const discount = couponDiscount ?? 0;
  const total = Math.max(0, cart.subtotal - discount);

  const initialAddressId = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? 'new';
  const [addressId, setAddressId] = useState<string>(initialAddressId);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [notes, setNotes] = useState('');

  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    country: 'US',
    city: '',
    area: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    isDefault: addresses.length === 0,
  });

  if (cart.lines.length === 0) {
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

  function handlePlaceOrder() {
    const usingNewAddress = addressId === 'new';
    if (usingNewAddress) {
      if (!newAddress.fullName || !newAddress.addressLine1 || !newAddress.city) {
        toast.error('Please fill in full name, address line 1 and city');
        return;
      }
    }

    start(async () => {
      const result = await placeOrder({
        ...(usingNewAddress ? { address: newAddress } : { addressId }),
        paymentMethod,
        notes: notes || undefined,
        couponCode: clientCart.couponCode ?? undefined,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      clearLocalCart();
      toast.success('Order placed');
      router.push(`/checkout/success/${result.data.orderId}`);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        {/* Shipping address */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping address</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {addresses.length > 0 ? (
              <div className="flex flex-col gap-2">
                {addresses.map((a) => (
                  <AddressRadio
                    key={a.id}
                    address={a}
                    active={addressId === a.id}
                    onSelect={() => setAddressId(a.id)}
                  />
                ))}
                <AddressNewRadio
                  active={addressId === 'new'}
                  onSelect={() => setAddressId('new')}
                />
              </div>
            ) : null}

            {addressId === 'new' ? (
              <div className="grid gap-4 rounded-md border border-border bg-muted/30 p-4 md:grid-cols-2">
                <Field label="Full name *">
                  <Input
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  />
                </Field>
                <Field label="Country (ISO-2) *">
                  <Input
                    maxLength={2}
                    value={newAddress.country}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, country: e.target.value.toUpperCase() })
                    }
                  />
                </Field>
                <Field label="City *">
                  <Input
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  />
                </Field>
                <Field label="Area">
                  <Input
                    value={newAddress.area}
                    onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                  />
                </Field>
                <Field label="Postal code">
                  <Input
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                  />
                </Field>
                <Field label="Address line 1 *" className="md:col-span-2">
                  <Input
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  />
                </Field>
                <Field label="Address line 2" className="md:col-span-2">
                  <Input
                    value={newAddress.addressLine2}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    className="size-4 rounded border-border accent-foreground"
                  />
                  Make this my default address
                </label>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Payment method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <PaymentOption
              active={paymentMethod === 'COD'}
              onSelect={() => setPaymentMethod('COD')}
              title="Cash on delivery"
              hint="Pay when your order arrives. Available in supported regions."
            />
            <PaymentOption
              active={paymentMethod === 'CARD'}
              onSelect={() => stripeEnabled && setPaymentMethod('CARD')}
              disabled={!stripeEnabled}
              title="Card (Stripe)"
              hint={
                stripeEnabled
                  ? 'A secure Stripe Elements form will appear on the next step.'
                  : 'Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your env to enable card payments.'
              }
            />
            <PaymentOption
              active={paymentMethod === 'BANK_TRANSFER'}
              onSelect={() => setPaymentMethod('BANK_TRANSFER')}
              title="Bank transfer"
              hint="Order is placed as pending. Wire instructions are emailed."
            />
          </CardContent>
        </Card>

        {/* Order notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Anything we should know about your delivery?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Order summary */}
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <Price amount={cart.subtotal} currency={cart.currency} size="sm" />
        </div>
        {discount > 0 ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Discount{couponCode ? ` (${couponCode})` : ''}
            </span>
            <span className="tabular-nums">
              −<Price amount={discount} currency={cart.currency} size="sm" />
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="eyebrow">Total</span>
          <Price amount={total} currency={cart.currency} size="lg" />
        </div>
        <p className="text-xs text-muted-foreground">
          Shipping &amp; taxes calculated after placement.
        </p>
        <Button size="lg" variant="gold" uppercase loading={pending} onClick={handlePlaceOrder}>
          Place order
        </Button>
      </aside>
    </div>
  );
}

// ---------------- helpers ----------------

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AddressRadio({
  address,
  active,
  onSelect,
}: {
  address: Address;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors',
        active ? 'border-foreground bg-muted/40' : 'border-border hover:border-foreground/40',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{address.fullName}</span>
        {address.isDefault ? <Badge variant="muted">Default</Badge> : null}
      </div>
      <span className="text-xs text-muted-foreground">
        {address.addressLine1}
        {address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city}
        {address.area ? `, ${address.area}` : ''}, {address.country}
        {address.postalCode ? ` ${address.postalCode}` : ''}
      </span>
    </button>
  );
}

function AddressNewRadio({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-md border border-dashed p-3 text-left text-sm transition-colors',
        active ? 'border-foreground bg-muted/40' : 'border-border hover:border-foreground/40',
      )}
    >
      + Use a new address
    </button>
  );
}

function PaymentOption({
  active,
  onSelect,
  title,
  hint,
  disabled,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors',
        active ? 'border-foreground bg-muted/40' : 'border-border hover:border-foreground/40',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}
