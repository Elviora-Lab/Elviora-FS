import { getSession } from '@/server/auth/get-session';
import { getOrCreateGuestId } from '@/server/auth/guest-session';
import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';
import { cartService } from '@/server/services/cart.service';

export const runtime = 'nodejs';

export const GET = createHandler(async (req) => {
  const session = await getSession(req);
  const sessionId = await getOrCreateGuestId();
  const cart = await cartService.getCart({
    userId: session?.sub ?? null,
    sessionId,
  });
  return apiSuccess(cart);
});
