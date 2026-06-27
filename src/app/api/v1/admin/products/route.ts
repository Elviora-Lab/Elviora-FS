import { requireAdmin } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';

export const runtime = 'nodejs';

/**
 * Admin product CRUD.
 *
 * Scaffold — wire the service + repository following the patterns in
 * /api/v1/products and /api/v1/cart.
 *
 * NOTE: edge middleware does not run on /api/* routes, so every admin handler
 * must enforce authorization itself via requireAdmin.
 */
export const GET = createHandler(async (req) => {
  await requireAdmin(req);
  return apiSuccess({ items: [] }, { message: 'Not yet implemented' });
});
