'use server';

import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from './_with-action';

import { getSession } from '@/server/auth/get-session';
import { getGuestId } from '@/server/auth/guest-session';

/**
 * On-site micro-survey capture — zero-party data (the qualitative "why"
 * behavioural logs can't give). Best-effort; identity is derived server-side.
 */
const surveyBody = z.object({
  kind: z.enum(['exit_intent', 'post_purchase']),
  question: z.string().min(1).max(64),
  answer: z.string().min(1).max(500),
  orderId: z.string().uuid().optional(),
  pagePath: z.string().min(1).max(512).optional(),
});

export const submitSurvey = withAction(async (input: z.infer<typeof surveyBody>) => {
  const body = surveyBody.parse(input);
  const [session, guestId] = await Promise.all([getSession(), getGuestId()]);

  await prisma.surveyResponse.create({
    data: {
      kind: body.kind,
      question: body.question,
      answer: body.answer,
      userId: session?.sub ?? null,
      guestId,
      orderId: body.orderId ?? null,
      pagePath: body.pagePath ?? null,
    },
  });

  return { ok: true };
});
