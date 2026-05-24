'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { updateStock } from '@/server/actions/admin/products.actions';

type Variant = {
  id: string;
  sku: string;
  size: string | null;
  shade: string | null;
  fragrance: string | null;
  stockQuantity: number;
};

export function StockEditor({ variants }: { variants: Variant[] }) {
  if (variants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No variants yet — variants will appear here once added.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {variants.map((v) => (
        <StockRow key={v.id} variant={v} />
      ))}
    </ul>
  );
}

function StockRow({ variant }: { variant: Variant }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(variant.stockQuantity);

  const label =
    [variant.size, variant.shade, variant.fragrance].filter(Boolean).join(' · ') || variant.sku;

  function save() {
    start(async () => {
      const result = await updateStock({ variantId: variant.id, stockQuantity: value });
      if (result.success) {
        toast.success(`${label} → ${value} units`);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="font-mono text-xs text-muted-foreground">{variant.sku}</div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
          className="w-24"
        />
        <Button
          size="sm"
          onClick={save}
          loading={pending}
          disabled={value === variant.stockQuantity}
        >
          Save
        </Button>
      </div>
    </li>
  );
}
