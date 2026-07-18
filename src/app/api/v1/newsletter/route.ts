import { z } from 'zod';

import { prisma } from '@/lib/db';

import { events } from '@/server/events';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { clientIp, enforceRateLimit } from '@/server/http/rate-limit';
import { apiSuccess } from '@/server/http/response';

export const runtime = 'nodejs';

const subscribeBody = z.object({ email: z.string().email() });

/** Subscribe an email to the newsletter (idempotent). */
export const POST = createHandler(async (req) => {
  // Throttle by IP to blunt subscription spam / email-list poisoning.
  await enforceRateLimit({ key: `newsletter:${clientIp(req)}`, limit: 10, windowSeconds: 3600 });

  const { email } = await parseJson(req, subscribeBody);
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { isActive: true },
    create: { email },
  });
  events.emit('newsletter.subscribed', { email });
  return apiSuccess({ email }, { message: 'Subscribed' });
});
