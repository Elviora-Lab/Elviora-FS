import { buildMetadata } from '@/lib/seo/metadata';

import { ProductForm } from '../_components/product-form';

export const metadata = buildMetadata({ title: 'Admin · New product', noIndex: true });

export default function NewProductPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">New product</h1>
        <p className="text-sm text-muted-foreground">Add a new piece to the catalog.</p>
      </header>
      <ProductForm mode="create" />
    </div>
  );
}
