'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { cn } from '@/lib/cn';
import { formatMoney } from '@/utils/format';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { bulkSetProductActive } from '@/server/actions/admin/products.actions';

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  shade: string;
  shadeColor: string | null;
  sku: string;
  categoryName: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
};

export function ProductsTable({
  rows,
  hasFilters = false,
}: {
  rows: ProductRow[];
  hasFilters?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  // Optimistic per-row active state + which rows have a toggle in flight.
  const [activeOverride, setActiveOverride] = useState<Record<string, boolean>>({});
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

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

  // Quick per-row toggle between active and hidden. Reuses the bulk action with
  // a single id, so PDP cache invalidation stays in one place.
  function toggleActive(id: string, currentActive: boolean) {
    const next = !currentActive;
    setActiveOverride((o) => ({ ...o, [id]: next }));
    setTogglingIds((s) => new Set(s).add(id));
    start(async () => {
      const res = await bulkSetProductActive({ ids: [id], isActive: next });
      setTogglingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      if (res.success) {
        toast.success(next ? 'Product set active' : 'Product hidden');
      } else {
        setActiveOverride((o) => ({ ...o, [id]: currentActive })); // revert
        toast.error(res.message);
      }
    });
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
                    {hasFilters
                      ? 'No products match your filters.'
                      : 'No products yet. Create or import some.'}
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      // Active → public page; hidden → admin-only preview (the
                      // public page 404s for hidden products).
                      const active = activeOverride[p.id] ?? p.isActive;
                      router.push(active ? `/products/${p.slug}` : `/products/${p.slug}/preview`);
                    }}
                    className={`cursor-pointer border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30 ${selected.has(p.id) ? 'bg-muted/40' : ''}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <ShadeTag shade={p.shade} color={p.shadeColor} />
                    </td>
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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <StatusToggle
                        active={activeOverride[p.id] ?? p.isActive}
                        pending={togglingIds.has(p.id)}
                        label={p.name}
                        onToggle={() => toggleActive(p.id, activeOverride[p.id] ?? p.isActive)}
                      />
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

/** Shade label + colour swatch shown under a product name. */
function ShadeTag({ shade, color }: { shade: string; color: string | null }) {
  return (
    <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
      {color ? (
        <span
          aria-hidden
          className="inline-block size-2.5 shrink-0 rounded-full ring-1 ring-border"
          style={{ backgroundColor: color }}
        />
      ) : null}
      {shade}
    </div>
  );
}

/** Inline switch that flips a product between active and hidden. */
function StatusToggle({
  active,
  pending,
  label,
  onToggle,
}: {
  active: boolean;
  pending: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${active ? 'Hide' : 'Activate'} ${label}`}
      title={active ? 'Active — click to hide' : 'Hidden — click to activate'}
      disabled={pending}
      onClick={onToggle}
      className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors',
          active ? 'border-success/30 bg-success/70' : 'border-border bg-muted',
        )}
      >
        <span
          className={cn(
            'inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform',
            active ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </span>
      <span
        className={cn(
          'text-[10px] font-medium uppercase tracking-[0.12em]',
          active ? 'text-success' : 'text-muted-foreground',
        )}
      >
        {active ? 'Active' : 'Hidden'}
      </span>
    </button>
  );
}
