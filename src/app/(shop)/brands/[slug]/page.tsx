import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '@/lib/seo/json-ld-component';
import { buildMetadata } from '@/lib/seo/metadata';

import { Breadcrumb } from '@/design-system/primitives/breadcrumb';
import { Section } from '@/design-system/primitives/section';

import { ProductFilters } from '@/features/products/components/product-filters';
import { ProductResults } from '@/features/products/components/product-results';

import { type ProductListSort } from '@/server/repositories/products.repo';
import { brandsService } from '@/server/services/brands.service';
import { productsService } from '@/server/services/products.service';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SORTS: ProductListSort[] = ['newest', 'popular', 'rating', 'price-asc', 'price-desc'];
const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await brandsService.getBySlug(slug);
  if (!brand || !brand.isActive) {
    return buildMetadata({ title: 'Brand not found', path: `/brands/${slug}`, noIndex: true });
  }
  return buildMetadata({
    title: brand.name,
    description: brand.description ?? `Shop ${brand.name} at Elviora.`,
    path: `/brands/${slug}`,
    image: brand.logo ?? undefined,
  });
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const brand = await brandsService.getBySlug(slug);
  if (!brand || !brand.isActive) notFound();

  const sortParam = str(sp.sort);
  const sort: ProductListSort = SORTS.includes(sortParam as ProductListSort)
    ? (sortParam as ProductListSort)
    : 'newest';
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const { items } = await productsService.list({ brand: slug }, sort, page, 24);

  return (
    <Section>
      <div className="container flex flex-col gap-6 sm:gap-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: brand.name }]} />
        <header className="flex items-start gap-5">
          {brand.logo ? (
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted sm:size-20">
              <Image src={brand.logo} alt={brand.name} fill className="object-contain p-2" />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Brand</span>
            <h1 className="editorial-heading text-display-lg">{brand.name}</h1>
            {brand.description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {brand.description}
              </p>
            ) : null}
          </div>
        </header>

        <ProductFilters />
        <ProductResults products={items} />

        <JsonLd
          data={breadcrumbJsonLd([
            { label: 'Home', href: '/' },
            { label: brand.name, href: `/brands/${slug}` },
          ])}
        />
      </div>
    </Section>
  );
}
