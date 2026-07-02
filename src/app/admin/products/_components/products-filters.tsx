'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CategoryOption = { id: string; name: string };

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
] as const;

export function ProductsFilters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, start] = useTransition();

  const q = search.get('q') ?? '';
  const category = search.get('category') ?? '';
  const status = search.get('status') ?? '';

  const [term, setTerm] = useState(q);
  // Keep the input in sync when the URL changes elsewhere (e.g. Clear all).
  useEffect(() => setTerm(q), [q]);

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(search.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete('page'); // any filter change returns to the first page
      start(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, search],
  );

  // Debounce the free-text search so we don't navigate on every keystroke.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = useCallback(
    (value: string) => {
      setTerm(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setParams({ q: value.trim() }), 300);
    },
    [setParams],
  );
  useEffect(() => () => void (debounceRef.current && clearTimeout(debounceRef.current)), []);

  const hasFilters = Boolean(q || category || status);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={term}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, SKU or shade…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setParams({ category: e.target.value })}
          aria-label="Filter by category"
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((o) => (
            <Button
              key={o.value || 'all'}
              size="sm"
              variant={status === o.value ? 'primary' : 'outline'}
              onClick={() => setParams({ status: o.value })}
            >
              {o.label}
            </Button>
          ))}
        </div>

        {hasFilters ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTerm('');
              setParams({ q: '', category: '', status: '' });
            }}
          >
            <X className="size-4" /> Clear
          </Button>
        ) : null}
      </div>

      {pending ? <span className="text-xs text-muted-foreground">Filtering…</span> : null}
    </div>
  );
}
