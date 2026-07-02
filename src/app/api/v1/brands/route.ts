import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';
import { brandsService } from '@/server/services/brands.service';

export const runtime = 'nodejs';
export const revalidate = 300;

/** GET /api/v1/brands — active brands with sellable product counts. */
export const GET = createHandler(async () => {
  const items = await brandsService.list();
  return apiSuccess(items);
});
