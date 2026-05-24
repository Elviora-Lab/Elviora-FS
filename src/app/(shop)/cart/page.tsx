import { buildMetadata } from '@/lib/seo/metadata';

import { Section } from '@/design-system/primitives/section';

import { CartPageClient } from './cart-client';

export const metadata = buildMetadata({
  title: 'Your bag',
  path: '/cart',
  noIndex: true,
});

export default function CartPage() {
  return (
    <Section>
      <div className="container flex flex-col gap-8">
        <h1 className="editorial-heading text-display-lg">Your bag</h1>
        <CartPageClient />
      </div>
    </Section>
  );
}
