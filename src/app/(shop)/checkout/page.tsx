import { buildMetadata } from '@/lib/seo/metadata';

import { Section } from '@/design-system/primitives/section';

import { CheckoutClient } from './checkout-client';

export const metadata = buildMetadata({
  title: 'Checkout',
  path: '/checkout',
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <Section>
      <div className="container flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="eyebrow">Final step</span>
          <h1 className="editorial-heading text-display-lg">Checkout</h1>
        </header>
        <CheckoutClient />
      </div>
    </Section>
  );
}
