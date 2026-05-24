import { Suspense } from 'react';
import type { Metadata } from 'next';

import { breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '@/lib/seo/json-ld-component';
import { buildMetadata } from '@/lib/seo/metadata';

import { Breadcrumb } from '@/design-system/primitives/breadcrumb';
import { Section } from '@/design-system/primitives/section';

import { CategoryProducts } from './category-products';

type Params = Promise<{ slug: string }>;

function prettify(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const name = prettify(slug);
  return buildMetadata({
    title: name,
    description: `Shop ${name} from Elviora — refined, ritual-led formulas.`,
    path: `/categories/${slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const name = prettify(slug);

  return (
    <Section>
      <div className="container flex flex-col gap-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Categories', href: '/categories' },
            { label: name },
          ]}
        />
        <header className="flex flex-col gap-2">
          <span className="eyebrow">Category</span>
          <h1 className="editorial-heading text-display-lg">{name}</h1>
        </header>

        <Suspense fallback={<div className="h-64" />}>
          <CategoryProducts slug={slug} />
        </Suspense>

        <JsonLd
          data={breadcrumbJsonLd([
            { label: 'Home', href: '/' },
            { label: 'Categories', href: '/categories' },
            { label: name, href: `/categories/${slug}` },
          ])}
        />
      </div>
    </Section>
  );
}
