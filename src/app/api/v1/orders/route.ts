import { PaymentMethod } from '@prisma/client';
import { z } from 'zod';

import { requireUser } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { paginated, paginationQuerySchema, resolvePagination } from '@/server/http/pagination';
import { parseJson, parseQuery } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { addressesService } from '@/server/services/addresses.service';
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
  couponCode: z.string().min(1).max(64).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.COD),
});

export const POST = createHandler(async (req) => {
  const session = await requireUser(req);
  const body = await parseJson(req, createOrderBody);

  // Resolve the address (404 if not owned by this user) and snapshot it onto
  // the order — matches the Server Action's behaviour.
  const address = await addressesService.getOwned(body.shippingAddressId, session.sub);

  const order = await ordersService.createFromCart({
    userId: session.sub,
    cartId: body.cartId,
    currency: body.currency,
    notes: body.notes,
    couponCode: body.couponCode,
    paymentMethod: body.paymentMethod ?? PaymentMethod.COD,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone ?? null,
      country: address.country,
      city: address.city,
      area: address.area ?? null,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? null,
      postalCode: address.postalCode ?? null,
    },
  });
  return apiSuccess(order, { status: 201, message: 'Order placed' });
});
