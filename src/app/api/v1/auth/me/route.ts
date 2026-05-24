import { requireUser } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';
import { authService } from '@/server/services/auth.service';

export const runtime = 'nodejs';

export const GET = createHandler(async (req) => {
  const session = await requireUser(req);
  const user = await authService.me(session.sub);
  return apiSuccess(user);
});
