'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { bulkImportProducts } from '@/server/actions/admin/products.actions';

const TEMPLATE_CSV = `name,price,sku,category,brand,description,imageUrl,stock,isActive
Rose Glow Serum,1299,RGS-01,Face,Elviora,Luminous daily serum,https://cdn.example.com/rgs.jpg,100,true
Velvet Matte Lip,599,VML-02,Lips,Elviora,Long-wear liquid lip,,50,true
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'elviora-products-template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type ImportRow = {
  name: string;
  price: string;
  sku?: string;
  category?: string;
  brand?: string;
  shortDescription?: string;
  imageUrl?: string;
  stock?: string;
  isActive?: boolean;
};

// Minimal CSV parser: handles quoted fields, escaped quotes, and newlines.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => Object.fromEntries(headers.map((h, idx) => [h, (r[idx] ?? '').trim()])));
}

const pick = (o: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) if (o[k]) return o[k];
  return '';
};

function toRows(raw: Record<string, string>[]): { valid: ImportRow[]; skipped: number } {
  let skipped = 0;
  const valid: ImportRow[] = [];
  for (const o of raw) {
    const name = pick(o, 'name', 'product', 'title').slice(0, 255);
    const priceStr = pick(o, 'price', 'current_price');
    const price = Number(priceStr);
    if (name.length < 2 || priceStr === '' || Number.isNaN(price) || price < 0) {
      skipped++;
      continue;
    }
    const img = pick(o, 'imageurl', 'image', 'image_url');
    const activeStr = pick(o, 'isactive', 'active', 'status');
    valid.push({
      name,
      price: priceStr,
      sku: pick(o, 'sku').slice(0, 80) || undefined,
      category: pick(o, 'category', 'categories').slice(0, 120) || undefined,
      brand: pick(o, 'brand', 'vendor').slice(0, 160) || undefined,
      shortDescription:
        pick(o, 'shortdescription', 'short_description', 'description').slice(0, 500) || undefined,
      imageUrl: /^https?:\/\//i.test(img) ? img : undefined,
      stock: /^\d+$/.test(pick(o, 'stock', 'inventory'))
        ? pick(o, 'stock', 'inventory')
        : undefined,
      isActive: activeStr ? !/^(false|0|no|hidden|inactive|disabled)$/i.test(activeStr) : undefined,
    });
  }
  return { valid, skipped };
}

export function BulkImport() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [pending, start] = useTransition();

  const { valid, skipped } = useMemo(() => {
    if (!text.trim()) return { valid: [] as ImportRow[], skipped: 0 };
    try {
      return toRows(parseCsv(text));
    } catch {
      return { valid: [] as ImportRow[], skipped: 0 };
    }
  }, [text]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setText(await file.text());
  }

  function runImport() {
    if (valid.length === 0) return;
    start(async () => {
      const res = await bulkImportProducts({ rows: valid });
      if (res.success) {
        const { created, updated, failed } = res.data;
        toast.success(
          `Imported: ${created} created, ${updated} updated${failed ? `, ${failed} failed` : ''}`,
        );
        setText('');
        router.push('/admin/products');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Upload CSV</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={downloadTemplate}>
          <Download className="size-4" /> Template
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="…or paste CSV here"
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {text.trim()
              ? `${valid.length} ready to import${skipped ? ` · ${skipped} skipped (missing name/price)` : ''}`
              : 'Headers: name, price, sku, category, brand, description, imageUrl, stock, isActive'}
          </p>
          <Button onClick={runImport} loading={pending} disabled={valid.length === 0} uppercase>
            Import {valid.length || ''}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
