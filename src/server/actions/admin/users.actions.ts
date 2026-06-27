'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { adminUsersRepo } from '@/server/repositories/admin.repo';

const setRoleBody = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(UserRole),
});

export const setUserRole = withAction(async (input: z.infer<typeof setRoleBody>) => {
  await requireAdmin();
  const { userId, role } = setRoleBody.parse(input);
  await adminUsersRepo.updateRole(userId, role);
  revalidatePath('/admin/users');
  return { userId, role };
});
