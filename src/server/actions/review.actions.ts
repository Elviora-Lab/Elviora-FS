'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from './_with-action';

import { requireUser } from '@/server/auth/guards';
import { verifyReviewToken } from '@/server/auth/tokens';
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

// ---------------------------------------------------------------------------
// Guest (verified-purchase) reviews — no account required.
// ---------------------------------------------------------------------------

const submitGuestReviewBody = z.object({
  token: z.string().min(1),
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200).optional(),
  comment: z.string().min(10).max(4000).optional(),
});

/**
 * Post a review as a guest, authorised by the signed link emailed at delivery.
 * The token proves the purchase (verified), so no login is needed. The product
 * must belong to the token's order; one review per (order, product). Lands as
 * unapproved for the same admin moderation as logged-in reviews.
 */
export const submitGuestReview = withAction(
  async (input: z.infer<typeof submitGuestReviewBody>) => {
    const body = submitGuestReviewBody.parse(input);

    let orderId: string;
    try {
      ({ orderId } = await verifyReviewToken(body.token));
    } catch {
      throw new Error('This review link is invalid or has expired.');
    }

    // The product must be part of this order — that's what makes it verified.
    const item = await prisma.orderItem.findFirst({
      where: { orderId, productId: body.productId },
      select: { id: true },
    });
    if (!item) throw new Error('That product isn’t part of this order.');

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, shippingFullName: true },
    });
    if (!order) throw new Error('We couldn’t find that order.');
    const author = (order.shippingFullName ?? 'Verified buyer').trim() || 'Verified buyer';

    const review = await prisma.review.upsert({
      where: { orderId_productId: { orderId, productId: body.productId } },
      update: {
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        authorName: author,
        isApproved: false,
      },
      create: {
        orderId,
        userId: order.userId ?? null,
        authorName: author,
        productId: body.productId,
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        isVerifiedPurchase: true,
      },
    });

    if (order.userId) {
      events.emit('review.created', {
        reviewId: review.id,
        productId: body.productId,
        userId: order.userId,
      });
    }

    revalidatePath(`/products/[slug]`, 'page');
    return { id: review.id };
  },
);
