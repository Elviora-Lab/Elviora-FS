'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { toSlug } from '@/utils/slug';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { adminProductsRepo } from '@/server/repositories/admin.repo';

const productBody = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(255).optional(),
  sku: z.string().min(2).max(80),
  shortDescription: z.string().max(500).optional(),
  fullDescription: z.string().max(8000).optional(),
  price: z.coerce.number().min(0),
  comparePrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
});

export const createProduct = withAction(async (input: z.infer<typeof productBody>) => {
  await requireAdmin();
  const data = productBody.parse(input);
  const product = await adminProductsRepo.create({
    name: data.name,
    slug: data.slug || toSlug(data.name),
    sku: data.sku,
    shortDescription: data.shortDescription,
    fullDescription: data.fullDescription,
    price: data.price,
    comparePrice: data.comparePrice,
    costPrice: data.costPrice,
    isFeatured: data.isFeatured ?? false,
    isActive: data.isActive ?? true,
    ...(data.categoryId ? { category: { connect: { id: data.categoryId } } } : {}),
    ...(data.brandId ? { brand: { connect: { id: data.brandId } } } : {}),
  });
  revalidatePath('/admin/products');
  return product;
});

export const updateProduct = withAction(
  async (input: { id: string } & Partial<z.infer<typeof productBody>>) => {
    await requireAdmin();
    const { id, ...rest } = input;
    const data = productBody.partial().parse(rest);
    const product = await adminProductsRepo.update(id, {
      ...data,
      ...(data.categoryId ? { category: { connect: { id: data.categoryId } } } : {}),
      ...(data.brandId ? { brand: { connect: { id: data.brandId } } } : {}),
    });
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}`);
    return product;
  },
);

export const deleteProduct = withAction(async (input: { id: string }) => {
  await requireAdmin();
  await adminProductsRepo.delete(input.id);
  revalidatePath('/admin/products');
  return { id: input.id };
});

export const updateStock = withAction(
  async (input: { variantId: string; stockQuantity: number }) => {
    await requireAdmin();
    const stockQuantity = Math.max(0, Math.floor(input.stockQuantity));
    await adminProductsRepo.updateVariantStock(input.variantId, stockQuantity);
    revalidatePath('/admin/products');
    return { variantId: input.variantId, stockQuantity };
  },
);
