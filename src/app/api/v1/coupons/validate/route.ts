import { z } from 'zod';

import { getSession } from '@/server/auth/get-session';
import { getOrCreateGuestId } from '@/server/auth/guest-session';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';
import { cartService } from '@/server/services/cart.service';
import { couponsService } from '@/server/services/coupons.service';

export const runtime = 'nodejs';

const validateBody = z.object({ code: z.string().min(1).max(64) });

/**
 * Preview a coupon against the caller's current cart. Returns the computed
 * discount so the UI can show the new total. The coupon is re-validated and its
 * usage counter incremented atomically at checkout — this endpoint never
 * mutates state.
 */
export const POST = createHandler(async (req) => {
  // Throttle by IP so coupon codes can't be brute-forced.
  await enforceRateLimit({ key: `coupon-validate:${clientIp(req)}`, limit: 10, windowSeconds: 60 });

  const { code } = await parseJson(req, validateBody);

  const session = await getSession(req);
  const sessionId = await getOrCreateGuestId();
  const cart = await cartService.getCart({ userId: session?.sub ?? null, sessionId });

  const { coupon, discount } = await couponsService.evaluate(code, cart.subtotal);

  return apiSuccess({
    code: coupon.code,
    discountType: coupon.discountType,
    discount: Number(discount),
    subtotal: cart.subtotal,
    total: Math.max(0, cart.subtotal - Number(discount)),
  });
});
