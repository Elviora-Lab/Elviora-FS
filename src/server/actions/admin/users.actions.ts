'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from '../_with-action';

import { requireRole } from '@/server/auth/guards';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/server/http/errors';
import { adminUsersRepo } from '@/server/repositories/admin.repo';

const setRoleBody = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(UserRole),
});

const PRIVILEGED: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];

export const setUserRole = withAction(async (input: z.infer<typeof setRoleBody>) => {
  // Role management is admin-only — STAFF passes requireAdmin elsewhere but
  // must not be able to escalate anyone (least of all themselves).
  const session = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { userId, role } = setRoleBody.parse(input);

  // No self-service: an admin can neither demote themselves (lock-out) nor
  // bump their own role. A second admin has to do it.
  if (userId === session.sub) {
    throw new BadRequestError('You cannot change your own role');
  }

  // Only a SUPER_ADMIN may hand out—or take away—privileged roles.
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) throw new NotFoundError('User not found');
  const touchesPrivileged = PRIVILEGED.includes(role) || PRIVILEGED.includes(target.role);
  if (touchesPrivileged && session.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Only a super admin can grant or revoke admin roles');
  }

  await adminUsersRepo.updateRole(userId, role);
  revalidatePath('/admin/users');
  return { userId, role };
});
