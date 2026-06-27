import { buildMetadata } from '@/lib/seo/metadata';

import { Section } from '@/design-system/primitives/section';

import { ProductFilters } from '@/features/products/components/product-filters';
import { ProductResults } from '@/features/products/components/product-results';

import { type ProductListSort } from '@/server/repositories/products.repo';
import { productsService } from '@/server/services/products.service';

export const metadata = buildMetadata({
  title: 'All products',
  description: 'Browse Elviora’s full edit of high-pigment lips, eyes, face, and nails.',
  path: '/products',
});

const SORTS: ProductListSort[] = ['newest', 'popular', 'rating', 'price-asc', 'price-desc'];
const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sortParam = str(sp.sort);
  const sort: ProductListSort = SORTS.includes(sortParam as ProductListSort)
    ? (sortParam as ProductListSort)
    : 'newest';
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const { items } = await productsService.list({ q: str(sp.q) }, sort, page, 24);

  return (
    <Section>
      <div className="container flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="eyebrow">The Edit</span>
          <h1 className="editorial-heading text-display-lg">All products</h1>
        </header>
        <ProductFilters />
        <ProductResults products={items} />
      </div>
    </Section>
  );
}
