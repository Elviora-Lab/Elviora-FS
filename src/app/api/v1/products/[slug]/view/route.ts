import { prisma } from '@/lib/db';

import { getSession } from '@/server/auth/get-session';
import { events } from '@/server/events';
import { createHandler } from '@/server/http/handler';
import { clientIp, isRateLimited } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';

export const runtime = 'nodejs';

/**
 * Records a product view (fired by the client beacon on the PDP). Emits the
 * `product.viewed` domain event, attributed to the signed-in user when present.
 */
export const POST = createHandler(async (req, ctx: { params: Promise<{ slug: string }> }) => {
  // View counts are best-effort analytics — drop silently when flooded rather
  // than surfacing a 429 to the shopper.
  if (await isRateLimited({ key: `pdp-view:${clientIp(req)}`, limit: 60, windowSeconds: 60 })) {
    return apiSuccess({ ok: true });
  }

  const { slug } = await ctx.params;
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (product) {
    const session = await getSession(req);
    events.emit('product.viewed', { productId: product.id, userId: session?.sub ?? null });
  }
  return apiSuccess({ ok: true });
});
