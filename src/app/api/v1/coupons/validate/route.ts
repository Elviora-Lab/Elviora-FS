import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';

export const runtime = 'nodejs';

/**
 * Validate a coupon against the current cart context.
 *
 * Scaffold — wire the service + repository following the patterns in
 * /api/v1/products and /api/v1/cart.
 */
export const GET = createHandler(async () => {
  return apiSuccess({ items: [] }, { message: 'Not yet implemented' });
});
