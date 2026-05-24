import { serverEnv } from '@/config/env';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section } from '@/design-system/primitives/section';

import { CheckoutClient } from './checkout-client';

import { requireUser } from '@/server/auth/guards';
import { getOrCreateGuestId } from '@/server/auth/guest-session';
import { addressesService } from '@/server/services/addresses.service';
import { cartService } from '@/server/services/cart.service';

export const metadata = buildMetadata({ title: 'Checkout', path: '/checkout', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  // Middleware already forces a login before /checkout, but enforce again
  // at the page so we have a typed session.
  const session = await requireUser();
  const sessionId = await getOrCreateGuestId();

  const [addresses, cart] = await Promise.all([
    addressesService.list(session.sub),
    cartService.getCart({ userId: session.sub, sessionId }),
  ]);

  return (
    <Section>
      <div className="container flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="eyebrow">Final step</span>
          <h1 className="editorial-heading text-display-lg">Checkout</h1>
        </header>
        <CheckoutClient
          addresses={addresses.map((a) => ({
            id: a.id,
            fullName: a.fullName,
            phone: a.phone,
            country: a.country,
            city: a.city,
            area: a.area,
            addressLine1: a.addressLine1,
            addressLine2: a.addressLine2,
            postalCode: a.postalCode,
            isDefault: a.isDefault,
          }))}
          cart={{
            lines: cart.lines,
            subtotal: cart.subtotal,
            currency: cart.currency,
          }}
          stripeEnabled={Boolean(serverEnv.STRIPE_SECRET_KEY)}
        />
      </div>
    </Section>
  );
}
