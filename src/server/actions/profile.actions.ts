'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { withAction } from './_with-action';

import { requireUser } from '@/server/auth/guards';
import { usersRepo } from '@/server/repositories/users.repo';

const profileBody = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().min(6).max(32).optional(),
});

export const updateProfile = withAction(async (input: z.infer<typeof profileBody>) => {
  const data = profileBody.parse(input);
  const session = await requireUser();
  const user = await usersRepo.update(session.sub, data);
  revalidatePath('/account');
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, phone: user.phone };
});
