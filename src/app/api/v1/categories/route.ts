import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';
import { categoriesService } from '@/server/services/categories.service';

export const runtime = 'nodejs';
export const revalidate = 300;

/**
 * GET /api/v1/categories
 * Active categories as a tree: top-level categories with their `children`
 * (subcategories) nested. Pass `?flat=1` for the legacy flat list.
 */
export const GET = createHandler(async (req) => {
  const flat = new URL(req.url).searchParams.get('flat');
  const items = flat ? await categoriesService.list() : await categoriesService.tree();
  return apiSuccess(items);
});
