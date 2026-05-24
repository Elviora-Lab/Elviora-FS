import { requireUser } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';
import { wishlistService } from '@/server/services/wishlist.service';

export const runtime = 'nodejs';

/**
 * GET /api/v1/wishlist
 * Returns the product-ids in the current user's wishlist. The full wishlist
 * (with product data) is fetched server-side in `/account/wishlist`; this
 * lightweight endpoint exists for the hydrator to keep the heart icons in
 * sync across the storefront.
 */
export const GET = createHandler(async (req) => {
  const session = await requireUser(req);
  const productIds = await wishlistService.productIds(session.sub);
  return apiSuccess({ productIds });
});
