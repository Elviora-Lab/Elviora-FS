import Link from 'next/link';
import { Plus, Upload } from 'lucide-react';

import { buildMetadata } from '@/lib/seo/metadata';

import { Button } from '@/components/ui/button';

import { ProductsTable } from './products-table';

import { adminProductsRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Products', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [items, total] = await adminProductsRepo.list({ take: 200 });

  const rows = items.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    categoryName: p.category?.name ?? null,
    price: Number(p.price),
    stock: p.variants.reduce((sum, v) => sum + v.stockQuantity, 0),
    isActive: p.isActive,
    imageUrl: p.images[0]?.imageUrl ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="editorial-heading text-display-md">Products</h1>
          <p className="text-sm text-muted-foreground">
            {total} total — manage catalog, pricing and stock.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/products/import">
              <Upload className="size-4" /> Bulk import
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" /> New product
            </Link>
          </Button>
        </div>
      </header>

      <ProductsTable rows={rows} />
    </div>
  );
}
