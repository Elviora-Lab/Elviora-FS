import { requireUser } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { addressesService } from '@/server/services/addresses.service';
import { addressBody } from '@/server/validators/addresses.schema';

export const runtime = 'nodejs';

export const GET = createHandler(async (req) => {
  const session = await requireUser(req);
  const items = await addressesService.list(session.sub);
  return apiSuccess(items);
});

export const POST = createHandler(async (req) => {
  const session = await requireUser(req);
  const body = await parseJson(req, addressBody);
  const address = await addressesService.create(session.sub, body);
  return apiSuccess(address, { status: 201, message: 'Address saved' });
});
