import { z } from 'zod';

import { prisma } from '@/lib/db';

import { events } from '@/server/events';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';

export const runtime = 'nodejs';

const subscribeBody = z.object({ email: z.string().email() });

/** Subscribe an email to the newsletter (idempotent). */
export const POST = createHandler(async (req) => {
  const { email } = await parseJson(req, subscribeBody);
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { isActive: true },
    create: { email },
  });
  events.emit('newsletter.subscribed', { email });
  return apiSuccess({ email }, { message: 'Subscribed' });
});
