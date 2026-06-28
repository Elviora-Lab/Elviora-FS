'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

import { formatMoney } from '@/utils/format';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { bulkSetProductActive } from '@/server/actions/admin/products.actions';

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  categoryName: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
};

export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function setActive(isActive: boolean) {
    const ids = [...selected];
    if (ids.length === 0) return;
    start(async () => {
      const res = await bulkSetProductActive({ ids, isActive });
      if (res.success) {
        toast.success(
          `${res.data.count} product${res.data.count === 1 ? '' : 's'} ${isActive ? 'enabled' : 'disabled'}`,
        );
        setSelected(new Set());
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk toolbar */}
      <div className="flex h-9 items-center gap-3">
        {selected.size > 0 ? (
          <>
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setActive(false)}>
              Disable
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setActive(true)}>
              Enable
            </Button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            Select products to enable or disable in bulk.
          </span>
        )}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
                <th className="w-14 px-4 py-3" />
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    No products yet. Create or import some.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-border/60 last:border-b-0 ${selected.has(p.id) ? 'bg-muted/40' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative size-10 overflow-hidden rounded-md bg-gradient-pearl">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
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
                    <td className="px-4 py-3 text-muted-foreground">{p.categoryName ?? '—'}</td>
                    <td className="px-4 py-3">{formatMoney(p.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.stock === 0 ? 'text-destructive' : p.stock < 10 ? 'text-brand-gold' : ''
                        }
                      >
                        {p.stock}
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
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
