import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';
import { categoriesService } from '@/server/services/categories.service';

export const runtime = 'nodejs';
export const revalidate = 300;

export const GET = createHandler(async () => {
  const items = await categoriesService.list();
  return apiSuccess(items);
});
