import { requireAdmin } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { paginated, paginationQuerySchema, resolvePagination } from '@/server/http/pagination';
import { parseQuery } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { adminUsersRepo } from '@/server/repositories/admin.repo';

export const runtime = 'nodejs';

/**
 * Admin user list. Edge middleware does not run on /api/* routes, so this
 * handler enforces authorization itself via requireAdmin.
 */
export const GET = createHandler(async (req) => {
  await requireAdmin(req);
  const pg = resolvePagination(parseQuery(req, paginationQuerySchema));
  const [items, total] = await adminUsersRepo.list({
    skip: (pg.page - 1) * pg.pageSize,
    take: pg.pageSize,
  });
  return apiSuccess(paginated(items, total, pg));
});
