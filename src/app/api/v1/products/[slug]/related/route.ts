import { z } from 'zod';

import { createHandler } from '@/server/http/handler';
import { parseParams, parseQuery } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { productsService } from '@/server/services/products.service';
import { productSlugParams } from '@/server/validators/products.schema';

export const runtime = 'nodejs';

const relatedQuery = z.object({ limit: z.coerce.number().int().min(1).max(20).default(4) });

export const GET = createHandler<{ slug: string }>(async (req, ctx) => {
  const { slug } = await parseParams(ctx, productSlugParams);
  const { limit } = parseQuery(req, relatedQuery);
  const items = await productsService.getRelated(slug, limit);
  return apiSuccess(items);
});
