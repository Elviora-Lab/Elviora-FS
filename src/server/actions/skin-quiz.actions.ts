'use server';

import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from './_with-action';

import { getSession } from '@/server/auth/get-session';

/**
 * Skin-quiz lead capture. Saves the taker's skin type + concerns and, for
 * guests, their email — turning the quiz into a lead magnet + a reachable
 * marketing segment (see /admin/audience). The Meta `Lead` event is fired
 * client-side with Advanced Matching from the same email.
 */
const skinQuizBody = z.object({
  email: z.string().email().max(255).optional(),
  skinType: z.string().min(1).max(32).optional(),
  concerns: z.array(z.string().min(1).max(40)).max(12).default([]),
});

export const submitSkinQuiz = withAction(async (input: z.infer<typeof skinQuizBody>) => {
  const body = skinQuizBody.parse(input);
  const session = await getSession();

  await prisma.aiSkinAssessment.create({
    data: {
      userId: session?.sub ?? null,
      email: body.email ?? session?.email ?? null,
      skinType: body.skinType ?? null,
      concerns: body.concerns,
    },
  });

  return { ok: true };
});
