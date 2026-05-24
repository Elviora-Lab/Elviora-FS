import 'server-only';

import { type NotificationType } from '@prisma/client';

import { prisma } from '@/lib/db';

/**
 * Single fan-out point for user notifications.
 * Always writes the in-app row; channels (email, push, sms, whatsapp) are
 * dispatched via the queue when configured.
 */
export async function notifyUser(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}) {
  await prisma.notification.create({ data: input });
  // Future: enqueue('notifications', { ...input, channels: ['email', 'push'] })
}
