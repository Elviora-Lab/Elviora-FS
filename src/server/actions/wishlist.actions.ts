'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { withAction } from './_with-action';

import { requireUser } from '@/server/auth/guards';
import { wishlistService } from '@/server/services/wishlist.service';

const idBody = z.object({ productId: z.string().uuid() });

export const toggleWishlist = withAction(async (input: unknown) => {
  const session = await requireUser();
  const { productId } = idBody.parse(input);
  const result = await wishlistService.toggle(session.sub, productId);
  revalidatePath('/account/wishlist');
  return result;
});

export const removeFromWishlist = withAction(async (input: unknown) => {
  const session = await requireUser();
  const { productId } = idBody.parse(input);
  await wishlistService.remove(session.sub, productId);
  revalidatePath('/account/wishlist');
  return { productId };
});
