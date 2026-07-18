import { requireAdmin } from '@/server/auth/guards';
import { NotFoundError } from '@/server/http/errors';
import { createHandler } from '@/server/http/handler';

export const runtime = 'nodejs';

/**
 * Admin order ops (fulfill, refund).
 *
 * Scaffold — wire the service + repository following the patterns in
 * /api/v1/products and /api/v1/cart.
 *
 * NOTE: edge middleware does not run on /api/* routes, so every admin handler
 * must enforce authorization itself via requireAdmin.
 */
export const GET = createHandler(async (req) => {
  await requireAdmin(req);
  // 404 until implemented — a scaffold that answers 200 looks like a
  // real (empty) endpoint to clients and crawlers.
  throw new NotFoundError();
});
