import { createHandler } from '@/server/http/handler';
import { paginated, resolvePagination } from '@/server/http/pagination';
import { parseQuery } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { productsService } from '@/server/services/products.service';
import { productListQuery } from '@/server/validators/products.schema';

export const runtime = 'nodejs';
export const revalidate = 60; // ISR-friendly: list responses are cached for 60s

export const GET = createHandler(async (req) => {
  const q = parseQuery(req, productListQuery);
  const pg = resolvePagination(q);

  const { items, total } = await productsService.list(
    {
      category: q.category,
      q: q.q,
      priceMin: q.priceMin,
      priceMax: q.priceMax,
      skinType: q.skinType,
      concern: q.concern,
      tag: q.tag,
    },
    q.sort ?? 'newest',
    pg.page,
    pg.pageSize,
  );

  return apiSuccess(paginated(items, total, pg));
});
