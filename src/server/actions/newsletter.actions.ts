'use server';

import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from './_with-action';

import { events } from '@/server/events';

const subscribeBody = z.object({ email: z.string().email() });

export const subscribeNewsletter = withAction(async (input: { email: string }) => {
  const { email } = subscribeBody.parse(input);
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { isActive: true },
    create: { email },
  });
  events.emit('newsletter.subscribed', { email });
  return { email };
});
