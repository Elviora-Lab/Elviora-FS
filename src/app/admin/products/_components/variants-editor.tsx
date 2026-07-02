'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  createVariant,
  deleteVariant,
  updateVariant,
} from '@/server/actions/admin/products.actions';

type Variant = {
  id: string;
  sku: string;
  size: string | null;
  shade: string | null;
  fragrance: string | null;
  price: number;
  stockQuantity: number;
  isActive: boolean;
};

/**
 * Full variant management for a product: edit SKU/shade/size/price/stock,
 * toggle availability, delete (blocked server-side when the variant has
 * order history), and add new variants. A product needs at least one active
 * in-stock variant to be purchasable.
 */
export function VariantsEditor({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No variants yet — the product cannot be purchased until one exists. Add one below.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {variants.map((v) => (
            <VariantRow key={v.id} variant={v} />
          ))}
        </ul>
      )}
      <AddVariantForm productId={productId} />
    </div>
  );
}

function VariantRow({ variant }: { variant: Variant }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [form, setForm] = useState({
    sku: variant.sku,
    shade: variant.shade ?? '',
    size: variant.size ?? '',
    price: variant.price,
    stockQuantity: variant.stockQuantity,
    isActive: variant.isActive,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function save() {
    start(async () => {
      const result = await updateVariant({ id: variant.id, ...form });
      if (result.success) {
        toast.success(`${form.sku} saved`);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function remove() {
    if (!confirm(`Delete variant ${variant.sku}? This cannot be undone.`)) return;
    startDelete(async () => {
      const result = await deleteVariant({ id: variant.id });
      if (result.success) {
        toast.success(`${variant.sku} deleted`);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <li className="grid grid-cols-2 items-end gap-3 py-4 sm:grid-cols-3 lg:grid-cols-7">
      <SmallField label="SKU">
        <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} className="h-9" />
      </SmallField>
      <SmallField label="Shade">
        <Input value={form.shade} onChange={(e) => set('shade', e.target.value)} className="h-9" />
      </SmallField>
      <SmallField label="Size">
        <Input value={form.size} onChange={(e) => set('size', e.target.value)} className="h-9" />
      </SmallField>
      <SmallField label="Price">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={(e) => set('price', Number(e.target.value))}
          className="h-9"
        />
      </SmallField>
      <SmallField label="Stock">
        <Input
          type="number"
          min="0"
          value={form.stockQuantity}
          onChange={(e) => set('stockQuantity', Math.max(0, Math.floor(Number(e.target.value))))}
          className="h-9"
        />
      </SmallField>
      <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set('isActive', e.target.checked)}
          className="size-4 rounded border-border accent-foreground"
        />
        Active
      </label>
      <div className="flex gap-2">
        <Button size="sm" loading={pending} onClick={save}>
          Save
        </Button>
        <Button size="sm" variant="destructive" loading={deleting} onClick={remove}>
          Delete
        </Button>
      </div>
    </li>
  );
}

function AddVariantForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    start(async () => {
      const result = await createVariant({
        productId,
        sku: String(formData.get('sku') ?? ''),
        shade: String(formData.get('shade') ?? ''),
        size: String(formData.get('size') ?? ''),
        price: Number(formData.get('price') ?? 0),
        stockQuantity: Math.max(0, Math.floor(Number(formData.get('stockQuantity') ?? 0))),
      });
      if (result.success) {
        toast.success('Variant added');
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="grid grid-cols-2 items-end gap-3 rounded-md border border-dashed border-border p-4 sm:grid-cols-3 lg:grid-cols-6"
    >
      <SmallField label="SKU">
        <Input name="sku" required placeholder="SB-V-…" className="h-9" />
      </SmallField>
      <SmallField label="Shade">
        <Input name="shade" placeholder="Rouge 04" className="h-9" />
      </SmallField>
      <SmallField label="Size">
        <Input name="size" placeholder="4.5 ml" className="h-9" />
      </SmallField>
      <SmallField label="Price">
        <Input name="price" type="number" step="0.01" min="0" required className="h-9" />
      </SmallField>
      <SmallField label="Stock">
        <Input name="stockQuantity" type="number" min="0" defaultValue={0} className="h-9" />
      </SmallField>
      <Button size="sm" type="submit" loading={pending}>
        Add variant
      </Button>
    </form>
  );
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
