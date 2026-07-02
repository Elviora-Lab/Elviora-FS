import Link from 'next/link';
import { Plus, Upload } from 'lucide-react';
import { z } from 'zod';

import { buildMetadata } from '@/lib/seo/metadata';

import { Button } from '@/components/ui/button';

import { ProductsFilters } from './_components/products-filters';
import { ProductsPagination } from './_components/products-pagination';
import { resolveShadeColor, shadeFromSlug } from './_lib/shade';
import { ProductsTable } from './products-table';

import { adminCategoriesRepo, adminProductsRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Products', noIndex: true });
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const filterSchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: z.string().uuid().optional(),
  status: z.enum(['active', 'hidden']).optional(),
});

type Props = {
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>;
};

export default async function AdminProductsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = filterSchema.safeParse({
    q: raw.q,
    category: raw.category,
    status: raw.status,
  });
  const { q, category: categoryId, status } = filters.success ? filters.data : {};
  const page = Math.max(1, Number(raw.page) || 1);

  const [[items, total], categories] = await Promise.all([
    adminProductsRepo.list({
      q,
      categoryId,
      status,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    adminCategoriesRepo.listAll(),
  ]);

  const rows = items.map((p) => {
    const shade = shadeFromSlug(p.slug, p.name);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      shade,
      // Real hex from the matching variant when available, else a keyword guess.
      shadeColor: resolveShadeColor(shade, p.variants, p.slug),
      categoryName: p.category?.name ?? null,
      price: Number(p.price),
      stock: p.variants.reduce((sum, v) => sum + v.stockQuantity, 0),
      isActive: p.isActive,
      imageUrl: p.images[0]?.imageUrl ?? null,
    };
  });

  const hasFilters = Boolean(q || categoryId || status);
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="editorial-heading text-display-md">Products</h1>
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? `${total} matching — manage catalog, pricing and stock.`
              : `${total} total — manage catalog, pricing and stock.`}
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

      <ProductsFilters categories={categoryOptions} />

      <ProductsTable rows={rows} hasFilters={hasFilters} />

      <ProductsPagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        params={{ q, category: categoryId, status }}
      />
    </div>
  );
}
