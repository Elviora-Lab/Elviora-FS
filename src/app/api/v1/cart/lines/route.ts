import { getSession } from '@/server/auth/get-session';
import { getOrCreateGuestId } from '@/server/auth/guest-session';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { cartService } from '@/server/services/cart.service';
import { addLineBody } from '@/server/validators/cart.schema';

export const runtime = 'nodejs';

export const POST = createHandler(async (req) => {
  const body = await parseJson(req, addLineBody);
  const session = await getSession(req);
  const sessionId = await getOrCreateGuestId();

  const cart = await cartService.addLine({ userId: session?.sub ?? null, sessionId }, body);
  return apiSuccess(cart, { status: 201, message: 'Item added to bag' });
});
