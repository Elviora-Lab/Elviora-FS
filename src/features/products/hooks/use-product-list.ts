'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { useListProductsQuery } from '../api/products-api';
import { productListQuerySchema } from '../schemas/product-schemas';

export function useProductList() {
  const search = useSearchParams();

  const params = useMemo(() => {
    const raw = Object.fromEntries(search.entries());
    const parsed = productListQuerySchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [search]);

  const query = useListProductsQuery(params);

  return { params, ...query };
}
