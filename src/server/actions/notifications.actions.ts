'use server';

import { revalidatePath } from 'next/cache';

import { withAction } from './_with-action';

import { requireUser } from '@/server/auth/guards';
import { notificationsRepo } from '@/server/repositories/notifications.repo';

export const markNotificationsRead = withAction(async () => {
  const session = await requireUser();
  await notificationsRepo.markAllRead(session.sub);
  revalidatePath('/account/notifications');
  return { ok: true };
});
