import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { buildMetadata } from '@/lib/seo/metadata';
import { formatMoney } from '@/utils/format';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { adminProductsRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Products', noIndex: true });
export const dynamic = 'force-dynamic';

function totalStock(variants: { stockQuantity: number }[]): number {
  return variants.reduce((sum, v) => sum + v.stockQuantity, 0);
}

export default async function AdminProductsPage() {
  const [items, total] = await adminProductsRepo.list({ take: 100 });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="editorial-heading text-display-md">Products</h1>
          <p className="text-sm text-muted-foreground">
            {total} total — manage catalog, pricing and stock.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" /> New product
          </Link>
        </Button>
      </header>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="w-16 px-4 py-3" />
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No products yet. Create your first one.
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const stock = totalStock(p.variants);
                  return (
                    <tr key={p.id} className="border-b border-border/60 last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="relative size-10 overflow-hidden rounded-md bg-gradient-pearl">
                          {p.images[0]?.imageUrl ? (
                            <Image
                              src={p.images[0].imageUrl}
                              alt={p.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3">{formatMoney(Number(p.price))}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            stock === 0 ? 'text-destructive' : stock < 10 ? 'text-brand-gold' : ''
                          }
                        >
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="muted">Hidden</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
