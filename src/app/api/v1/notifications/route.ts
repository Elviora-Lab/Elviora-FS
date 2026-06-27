import { requireUser } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { apiSuccess } from '@/server/http/response';
import { notificationsRepo } from '@/server/repositories/notifications.repo';

export const runtime = 'nodejs';

/** Logged-in user's in-app notifications inbox. */
export const GET = createHandler(async (req) => {
  const session = await requireUser(req);
  const [items, unread] = await Promise.all([
    notificationsRepo.listForUser(session.sub),
    notificationsRepo.unreadCount(session.sub),
  ]);
  return apiSuccess({ items, unread });
});
