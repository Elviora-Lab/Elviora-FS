import type { Metadata } from 'next';

import { breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '@/lib/seo/json-ld-component';
import { buildMetadata } from '@/lib/seo/metadata';

import { Breadcrumb } from '@/design-system/primitives/breadcrumb';
import { Section } from '@/design-system/primitives/section';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const pretty = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return buildMetadata({
    title: pretty,
    description: `${pretty} — refined formula from the Elviora edit.`,
    path: `/products/${slug}`,
  });
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const pretty = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <Section>
      <div className="container flex flex-col gap-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: pretty },
          ]}
        />
        <h1 className="editorial-heading text-display-lg">{pretty}</h1>
        <p className="max-w-prose text-muted-foreground">
          Product detail is wired through{' '}
          <code className="font-mono text-xs">useGetProductQuery</code>. Connect this page to the
          real endpoint and render the gallery, variants, benefits, ingredients and reviews composed
          from the design-system primitives.
        </p>
        <JsonLd
          data={breadcrumbJsonLd([
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: pretty, href: `/products/${slug}` },
          ])}
        />
      </div>
    </Section>
  );
}
