'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most loved' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price — low to high' },
  { value: 'price-desc', label: 'Price — high to low' },
] as const;

export function ProductFilters() {
  const router = useRouter();
  const search = useSearchParams();
  const activeSort = search.get('sort') ?? 'newest';

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(search.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page'); // reset pagination
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, search],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow mr-2">Sort</span>
      {SORT_OPTIONS.map((o) => (
        <Button
          key={o.value}
          size="sm"
          variant={activeSort === o.value ? 'primary' : 'outline'}
          onClick={() => setParam('sort', o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
