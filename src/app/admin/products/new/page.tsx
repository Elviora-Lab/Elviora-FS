import { buildMetadata } from '@/lib/seo/metadata';

import { getCategoryOptions } from '../_components/category-options';
import { ProductForm } from '../_components/product-form';

import { adminBrandsRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · New product', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([getCategoryOptions(), adminBrandsRepo.listAll()]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">New product</h1>
        <p className="text-sm text-muted-foreground">Add a new piece to the catalog.</p>
      </header>
      <ProductForm
        mode="create"
        categories={categories}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
