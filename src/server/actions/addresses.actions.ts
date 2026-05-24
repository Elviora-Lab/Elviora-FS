'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { withAction } from './_with-action';

import { requireUser } from '@/server/auth/guards';
import { addressesRepo } from '@/server/repositories/addresses.repo';
import { addressesService } from '@/server/services/addresses.service';
import { addressBody } from '@/server/validators/addresses.schema';

export const createAddress = withAction(async (input: unknown) => {
  const session = await requireUser();
  const data = addressBody.parse(input);
  const address = await addressesService.create(session.sub, data);
  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return address;
});

const deleteBody = z.object({ id: z.string().uuid() });

export const deleteAddress = withAction(async (input: unknown) => {
  const session = await requireUser();
  const { id } = deleteBody.parse(input);
  await addressesRepo.delete(id, session.sub);
  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return { id };
});
