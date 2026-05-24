import { z } from 'zod';

import { requireUser } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { parseParams } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { ordersService } from '@/server/services/orders.service';

export const runtime = 'nodejs';

const params = z.object({ orderId: z.string().uuid() });

export const GET = createHandler<{ orderId: string }>(async (req, ctx) => {
  const session = await requireUser(req);
  const { orderId } = await parseParams(ctx, params);
  const order = await ordersService.getDetail(orderId, session.sub);
  return apiSuccess(order);
});
