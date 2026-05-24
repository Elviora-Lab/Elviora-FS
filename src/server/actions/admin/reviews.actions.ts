'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { adminReviewsRepo } from '@/server/repositories/admin.repo';

const reviewIdBody = z.object({ id: z.string().uuid() });

export const approveReview = withAction(async (input: z.infer<typeof reviewIdBody>) => {
  await requireAdmin();
  const { id } = reviewIdBody.parse(input);
  await adminReviewsRepo.approve(id);
  revalidatePath('/admin/reviews');
  return { id };
});

export const deleteReview = withAction(async (input: z.infer<typeof reviewIdBody>) => {
  await requireAdmin();
  const { id } = reviewIdBody.parse(input);
  await adminReviewsRepo.delete(id);
  revalidatePath('/admin/reviews');
  return { id };
});
