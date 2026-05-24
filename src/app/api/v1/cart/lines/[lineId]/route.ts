import { getSession } from '@/server/auth/get-session';
import { getOrCreateGuestId } from '@/server/auth/guest-session';
import { createHandler } from '@/server/http/handler';
import { parseJson, parseParams } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { cartService } from '@/server/services/cart.service';
import { lineParams, updateLineBody } from '@/server/validators/cart.schema';

export const runtime = 'nodejs';

export const PATCH = createHandler<{ lineId: string }>(async (req, ctx) => {
  const { lineId } = await parseParams(ctx, lineParams);
  const body = await parseJson(req, updateLineBody);
  const session = await getSession(req);
  const sessionId = await getOrCreateGuestId();

  const cart = await cartService.updateLineQuantity(
    { userId: session?.sub ?? null, sessionId },
    { lineId, quantity: body.quantity },
  );
  return apiSuccess(cart);
});

export const DELETE = createHandler<{ lineId: string }>(async (req, ctx) => {
  const { lineId } = await parseParams(ctx, lineParams);
  const session = await getSession(req);
  const sessionId = await getOrCreateGuestId();

  const cart = await cartService.removeLine({ userId: session?.sub ?? null, sessionId }, lineId);
  return apiSuccess(cart);
});
