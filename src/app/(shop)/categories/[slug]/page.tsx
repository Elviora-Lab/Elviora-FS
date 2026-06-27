import type { Metadata } from 'next';

import { breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '@/lib/seo/json-ld-component';
import { buildMetadata } from '@/lib/seo/metadata';

import { Breadcrumb } from '@/design-system/primitives/breadcrumb';
import { Section } from '@/design-system/primitives/section';

import { ProductFilters } from '@/features/products/components/product-filters';
import { ProductResults } from '@/features/products/components/product-results';

import { type ProductListSort } from '@/server/repositories/products.repo';
import { productsService } from '@/server/services/products.service';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SORTS: ProductListSort[] = ['newest', 'popular', 'rating', 'price-asc', 'price-desc'];
const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

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
    description: `Shop ${name} from Elviora — refined, ritual-led colour.`,
    path: `/categories/${slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const name = prettify(slug);

  const sortParam = str(sp.sort);
  const sort: ProductListSort = SORTS.includes(sortParam as ProductListSort)
    ? (sortParam as ProductListSort)
    : 'newest';
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const { items } = await productsService.list({ category: slug }, sort, page, 24);

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

        <ProductFilters />
        <ProductResults products={items} />

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
