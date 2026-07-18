'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { toSlug } from '@/utils/slug';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { adminBlogRepo } from '@/server/repositories/admin.repo';
import { idInput } from '@/server/validators/admin-common.schema';

const createBody = z.object({
  title: z.string().min(2).max(255),
  content: z.string().min(10),
  seoDescription: z.string().max(500).optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

export const createBlogPost = withAction(async (input: z.infer<typeof createBody>) => {
  await requireAdmin();
  const data = createBody.parse(input);
  const published = data.isPublished ?? false;
  const post = await adminBlogRepo.create({
    title: data.title,
    slug: toSlug(data.title),
    content: data.content,
    seoDescription: data.seoDescription || null,
    isPublished: published,
    publishedAt: published ? new Date() : null,
  });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return post;
});

export const deleteBlogPost = withAction(async (input: { id: string }) => {
  await requireAdmin();
  const { id } = idInput.parse(input);
  await adminBlogRepo.delete(id);
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { id: input.id };
});

export const togglePublish = withAction(async (input: { id: string; isPublished: boolean }) => {
  await requireAdmin();
  const { id, isPublished } = z
    .object({ id: z.string().uuid(), isPublished: z.boolean() })
    .parse(input);
  await adminBlogRepo.setPublished(id, isPublished);
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { id: input.id, isPublished: input.isPublished };
});
