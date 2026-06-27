'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { adminBannersRepo } from '@/server/repositories/admin.repo';

const createBody = z.object({
  title: z.string().min(2).max(200),
  imageUrl: z.string().url(),
  position: z.string().min(2).max(64),
  redirectUrl: z.string().url().optional().or(z.literal('')),
});

export const createBanner = withAction(async (input: z.infer<typeof createBody>) => {
  await requireAdmin();
  const data = createBody.parse(input);
  const banner = await adminBannersRepo.create({
    title: data.title,
    imageUrl: data.imageUrl,
    position: data.position,
    redirectUrl: data.redirectUrl || null,
  });
  revalidatePath('/admin/banners');
  return banner;
});

export const deleteBanner = withAction(async (input: { id: string }) => {
  await requireAdmin();
  await adminBannersRepo.delete(input.id);
  revalidatePath('/admin/banners');
  return { id: input.id };
});

export const toggleBanner = withAction(async (input: { id: string; isActive: boolean }) => {
  await requireAdmin();
  await adminBannersRepo.setActive(input.id, input.isActive);
  revalidatePath('/admin/banners');
  return { id: input.id, isActive: input.isActive };
});
