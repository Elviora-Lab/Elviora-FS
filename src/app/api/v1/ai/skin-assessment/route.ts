import { NotFoundError } from '@/server/http/errors';
import { createHandler } from '@/server/http/handler';

export const runtime = 'nodejs';

/**
 * Run a skin assessment + persist the result.
 *
 * Scaffold — wire the service + repository following the patterns in
 * /api/v1/products and /api/v1/cart.
 */
export const GET = createHandler(async () => {
  // 404 until implemented — a scaffold that answers 200 looks like a
  // real (empty) endpoint to clients and crawlers.
  throw new NotFoundError();
});
