import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { siteConfig } from '@/config/site';

import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '@/lib/seo/json-ld-component';
import { buildMetadata } from '@/lib/seo/metadata';

import { ProductCard } from '@/design-system/patterns/product-card';
import { Breadcrumb } from '@/design-system/primitives/breadcrumb';
import { Section } from '@/design-system/primitives/section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

import { ProductGallery } from './_components/product-gallery';
import { ProductPurchase } from './_components/product-purchase';

import { productsService } from '@/server/services/products.service';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await productsService.getBySlug(slug);
    return buildMetadata({
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.shortDescription ?? siteConfig.description,
      path: `/products/${slug}`,
      image: product.images[0]?.imageUrl,
    });
  } catch {
    return buildMetadata({ title: 'Not found', path: `/products/${slug}`, noIndex: true });
  }
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  let product;
  try {
    product = await productsService.getBySlug(slug);
  } catch {
    notFound();
  }

  const related = await productsService.getRelated(slug, 4).catch(() => []);

  const primaryImage = product.images[0]?.imageUrl;
  const galleryImages = product.images.map((img) => ({
    url: img.imageUrl,
    alt: img.altText ?? product.name,
  }));

  const startingPrice = Math.min(...product.variants.map((v) => Number(v.price)));
  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

  return (
    <Section>
      <div className="container flex flex-col gap-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            ...(product.category
              ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <ProductGallery images={galleryImages} productName={product.name} />

          {/* Purchase column */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              {product.brand ? <span className="eyebrow">{product.brand.name}</span> : null}
              <h1 className="editorial-heading text-display-md md:text-display-lg">
                {product.name}
              </h1>
              {product.shortDescription ? (
                <p className="text-pretty leading-relaxed text-muted-foreground">
                  {product.shortDescription}
                </p>
              ) : null}
            </div>

            {product.skinConcerns.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {product.skinConcerns.map((pc) => (
                  <Badge key={pc.skinConcern.id} variant="outline">
                    {pc.skinConcern.name}
                  </Badge>
                ))}
              </div>
            ) : null}

            <ProductPurchase
              productId={product.id}
              variants={product.variants.map((v) => ({
                id: v.id,
                label: [v.size, v.shade, v.fragrance].filter(Boolean).join(' · ') || v.sku,
                price: Number(v.price),
                stockQuantity: v.stockQuantity,
                isActive: v.isActive,
              }))}
              comparePrice={product.comparePrice ? Number(product.comparePrice) : undefined}
              currency="USD"
              fallbackPrice={startingPrice}
              outOfStock={totalStock === 0}
            />

            {/* Detail accordion */}
            <Accordion type="multiple" defaultValue={['description']} className="mt-2">
              <AccordionItem value="description">
                <AccordionTrigger>Description</AccordionTrigger>
                <AccordionContent>
                  {product.fullDescription ?? product.shortDescription ?? 'No description yet.'}
                </AccordionContent>
              </AccordionItem>

              {product.ingredients.length > 0 ? (
                <AccordionItem value="ingredients">
                  <AccordionTrigger>Hero ingredients</AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex flex-col gap-2">
                      {product.ingredients.map((pi) => (
                        <li key={pi.ingredient.id}>
                          <span className="font-medium text-foreground">{pi.ingredient.name}</span>
                          {pi.ingredient.description ? (
                            <span className="text-muted-foreground">
                              {' '}
                              — {pi.ingredient.description}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ) : null}

              <AccordionItem value="ritual">
                <AccordionTrigger>How to use</AccordionTrigger>
                <AccordionContent>
                  Apply to clean skin morning and evening. Layer under a moisturizer. Always follow
                  daytime use with broad-spectrum sunscreen.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping">
                <AccordionTrigger>Shipping &amp; returns</AccordionTrigger>
                <AccordionContent>
                  Complimentary shipping on orders over $75. Free 30-day returns on all unopened
                  products.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 ? (
          <section className="flex flex-col gap-6 pt-8">
            <header className="flex flex-col gap-1">
              <span className="eyebrow">You may also love</span>
              <h2 className="editorial-heading text-display-sm">Considered alongside</h2>
            </header>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}

        {/* SEO */}
        <JsonLd
          data={breadcrumbJsonLd([
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: product.name, href: `/products/${slug}` },
          ])}
        />
        <JsonLd
          data={productJsonLd({
            name: product.name,
            slug: product.slug,
            description: product.shortDescription ?? product.fullDescription ?? '',
            imageUrl: primaryImage ?? '',
            price: startingPrice,
            currency: 'USD',
            inStock: totalStock > 0,
            brand: product.brand?.name,
          })}
        />
      </div>
    </Section>
  );
}
