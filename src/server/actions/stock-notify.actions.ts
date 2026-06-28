'use server';

import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from './_with-action';

import { getSession } from '@/server/auth/get-session';
import { BadRequestError, NotFoundError } from '@/server/http/errors';

const body = z.object({
  variantId: z.string().uuid(),
  email: z.string().email(),
});

/** Join the back-in-stock waitlist for an out-of-stock variant (guest or user). */
export const requestStockNotification = withAction(async (input: z.infer<typeof body>) => {
  const { variantId, email } = body.parse(input);

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, stockQuantity: true, productId: true },
  });
  if (!variant) throw new NotFoundError('Variant not found');
  if (variant.stockQuantity > 0) throw new BadRequestError('This item is already in stock');

  const session = await getSession();

  await prisma.stockNotification.upsert({
    where: { variantId_email: { variantId, email } },
    update: { notifiedAt: null, userId: session?.sub ?? null },
    create: { variantId, productId: variant.productId, email, userId: session?.sub ?? null },
  });

  return { ok: true };
});
