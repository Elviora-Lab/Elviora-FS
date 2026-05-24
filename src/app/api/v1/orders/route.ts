import { z } from 'zod';

import { requireUser } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { paginated, paginationQuerySchema, resolvePagination } from '@/server/http/pagination';
import { parseJson, parseQuery } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { ordersService } from '@/server/services/orders.service';

export const runtime = 'nodejs';

export const GET = createHandler(async (req) => {
  const session = await requireUser(req);
  const pg = resolvePagination(parseQuery(req, paginationQuerySchema));
  const { items, total } = await ordersService.listForUser(session.sub, pg.page, pg.pageSize);
  return apiSuccess(paginated(items, total, pg));
});

const createOrderBody = z.object({
  cartId: z.string().uuid(),
  shippingAddressId: z.string().uuid(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(500).optional(),
});

export const POST = createHandler(async (req) => {
  const session = await requireUser(req);
  const body = await parseJson(req, createOrderBody);
  const order = await ordersService.createFromCart({
    userId: session.sub,
    cartId: body.cartId,
    shippingAddressId: body.shippingAddressId,
    currency: body.currency,
    notes: body.notes,
  });
  return apiSuccess(order, { status: 201, message: 'Order placed' });
});
