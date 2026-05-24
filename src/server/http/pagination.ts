import 'server-only';

import { z } from 'zod';

import { PAGINATION } from '@/constants';

/**
 * Pagination input — both fields are optional in the query string. Defaults
 * are applied by `resolvePagination()` rather than via Zod's `.default()`,
 * which produces a `T | undefined` output type under our strict TS settings.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).optional(),
  pageSize: z.coerce.number().int().min(1).max(PAGINATION.maxPageSize).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type ResolvedPagination = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export function resolvePagination(query: PaginationQuery): ResolvedPagination {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? PAGINATION.defaultPageSize;
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export function paginated<T>(
  items: T[],
  total: number,
  p: { page: number; pageSize: number },
): Paginated<T> {
  return {
    items,
    total,
    page: p.page,
    pageSize: p.pageSize,
    hasMore: p.page * p.pageSize < total,
  };
}
