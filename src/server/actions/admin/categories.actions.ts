'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { toSlug } from '@/utils/slug';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { cache } from '@/server/cache';
import { adminCategoriesRepo } from '@/server/repositories/admin.repo';

const categoryBody = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(180).optional(),
  description: z.string().max(2000).optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const createCategory = withAction(async (input: z.infer<typeof categoryBody>) => {
  await requireAdmin();
  const data = categoryBody.parse(input);
  const cat = await adminCategoriesRepo.create({
    name: data.name,
    slug: data.slug || toSlug(data.name),
    description: data.description,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
    ...(data.parentId ? { parent: { connect: { id: data.parentId } } } : {}),
  });
  await cache.delete('categories:active');
  revalidatePath('/admin/categories');
  return cat;
});

export const deleteCategory = withAction(async (input: { id: string }) => {
  await requireAdmin();
  await adminCategoriesRepo.delete(input.id);
  await cache.delete('categories:active');
  revalidatePath('/admin/categories');
  return { id: input.id };
});
