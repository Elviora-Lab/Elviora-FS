'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from './_with-action';

import { requireUser } from '@/server/auth/guards';
import { events } from '@/server/events';

const submitReviewBody = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200).optional(),
  comment: z.string().min(10).max(4000).optional(),
});

export const submitReview = withAction(async (input: z.infer<typeof submitReviewBody>) => {
  const body = submitReviewBody.parse(input);
  const session = await requireUser();

  // Verified purchase = at least one delivered order containing this product.
  const verified = await prisma.orderItem.count({
    where: {
      productId: body.productId,
      order: { userId: session.sub, orderStatus: { in: ['DELIVERED', 'SHIPPED'] } },
    },
  });

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: session.sub, productId: body.productId } },
    update: { rating: body.rating, title: body.title, comment: body.comment, isApproved: false },
    create: {
      userId: session.sub,
      productId: body.productId,
      rating: body.rating,
      title: body.title,
      comment: body.comment,
      isVerifiedPurchase: verified > 0,
    },
  });

  events.emit('review.created', {
    reviewId: review.id,
    productId: body.productId,
    userId: session.sub,
  });

  revalidatePath(`/products/[slug]`, 'page');
  return review;
});
