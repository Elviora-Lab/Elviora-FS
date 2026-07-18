'use server';

import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from './_with-action';

import { events } from '@/server/events';
import { clientIpFromAction, enforceRateLimit } from '@/server/http/rate-limit';

const subscribeBody = z.object({ email: z.string().email() });

export const subscribeNewsletter = withAction(async (input: { email: string }) => {
  // Throttle by IP to blunt subscription spam / email-list poisoning.
  await enforceRateLimit({
    key: `newsletter:${await clientIpFromAction()}`,
    limit: 10,
    windowSeconds: 3600,
  });

  const { email } = subscribeBody.parse(input);
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { isActive: true },
    create: { email },
  });
  events.emit('newsletter.subscribed', { email });
  return { email };
});
