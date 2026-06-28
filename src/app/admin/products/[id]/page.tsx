import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buildMetadata } from '@/lib/seo/metadata';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ProductForm } from '../_components/product-form';
import { StockEditor } from '../_components/stock-editor';

import { adminProductsRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Edit product', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await adminProductsRepo.findById(id);
  if (!product) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="editorial-heading text-display-md">{product.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{product.sku}</p>
        </div>
        <Link
          href="/admin/products"
          className="text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
        >
          ← All products
        </Link>
      </header>

      <ProductForm
        mode="edit"
        defaultValues={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          shortDescription: product.shortDescription ?? '',
          fullDescription: product.fullDescription ?? '',
          price: Number(product.price),
          comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
          costPrice: product.costPrice ? Number(product.costPrice) : undefined,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          images: product.images.filter((img) => !img.variantId).map((img) => img.imageUrl),
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Stock by variant</CardTitle>
        </CardHeader>
        <CardContent>
          <StockEditor
            variants={product.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              size: v.size,
              shade: v.shade,
              fragrance: v.fragrance,
              stockQuantity: v.stockQuantity,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
