import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';

export const runtime = 'nodejs';

/**
 * Full-text search over products.
 *
 * Scaffold — wire the service + repository following the patterns in
 * /api/v1/products and /api/v1/cart.
 */
export const GET = createHandler(async () => {
  return apiSuccess({ items: [] }, { message: 'Not yet implemented' });
});
