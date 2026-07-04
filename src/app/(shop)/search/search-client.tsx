'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { metaPixel } from '@/lib/analytics/meta-pixel';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { Input } from '@/components/ui/input';

import { useListProductsQuery } from '@/features/products/api/products-api';
import { ProductGrid } from '@/features/products/components/product-grid';

export function SearchClient() {
  const search = useSearchParams();
  const router = useRouter();
  const initial = search.get('q') ?? '';
  const [value, setValue] = useState(initial);
  const debounced = useDebouncedValue(value, 250);

  useEffect(() => {
    const params = new URLSearchParams(search.toString());
    if (debounced) params.set('q', debounced);
    else params.delete('q');
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [debounced, router, search]);

  // Meta Pixel: fire Search as the debounced query settles.
  useEffect(() => {
    if (debounced.trim()) metaPixel.search(debounced.trim());
  }, [debounced]);

  const { data, isFetching } = useListProductsQuery(
    { q: debounced || undefined },
    { skip: !debounced },
  );

  return (
    <div className="flex flex-col gap-8">
      <Input
        autoFocus
        type="search"
        placeholder="Search by name, ingredient, concern…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-xl"
      />
      {debounced ? (
        <ProductGrid products={data?.items} loading={isFetching} />
      ) : (
        <p className="text-sm text-muted-foreground">Start typing to discover the edit.</p>
      )}
    </div>
  );
}
