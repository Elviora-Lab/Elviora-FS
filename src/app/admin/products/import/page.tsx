import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';

import { BulkImport } from './bulk-import';

export const metadata = buildMetadata({ title: 'Admin · Import products', noIndex: true });

export default function ImportProductsPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin/products"
          className="text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          ← Products
        </Link>
        <h1 className="editorial-heading text-display-md">Bulk import</h1>
        <p className="text-sm text-muted-foreground">
          Upload or paste a CSV. Products are matched by name — existing ones are updated, new ones
          are created with a default sellable variant. Only <strong>name</strong> and{' '}
          <strong>price</strong> are required.
        </p>
      </header>

      <BulkImport />

      <div className="rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Example CSV</p>
        <pre className="overflow-x-auto whitespace-pre">{`name,price,sku,category,brand,description,imageUrl,stock,isActive
Rose Glow Serum,1299,RGS-01,Face,Elviora,Luminous daily serum,https://cdn.example.com/rgs.jpg,100,true
Velvet Matte Lip,599,VML-02,Lips,Elviora,Long-wear liquid lip,,50,true`}</pre>
      </div>
    </div>
  );
}
