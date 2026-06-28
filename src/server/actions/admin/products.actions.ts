'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { toSlug } from '@/utils/slug';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { adminProductsRepo } from '@/server/repositories/admin.repo';
import { productsService } from '@/server/services/products.service';

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
  // Product-level gallery image URLs (first = primary). Uploaded via the
  // presign flow or pasted directly.
  images: z.array(z.string().url()).max(20).optional(),
});

/** Replace a product's gallery (product-level images only; variant-linked
 *  images are left untouched). First URL becomes the primary image. */
async function setProductImages(productId: string, images: string[]) {
  await prisma.productImage.deleteMany({ where: { productId, variantId: null } });
  if (images.length) {
    await prisma.productImage.createMany({
      data: images.map((imageUrl, i) => ({
        productId,
        imageUrl,
        isPrimary: i === 0,
        sortOrder: i,
      })),
    });
  }
}

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
  if (data.images?.length) await setProductImages(product.id, data.images);
  revalidatePath('/admin/products');
  return product;
});

export const updateProduct = withAction(
  async (input: { id: string } & Partial<z.infer<typeof productBody>>) => {
    await requireAdmin();
    const { id, ...rest } = input;
    const { images, ...data } = productBody.partial().parse(rest);
    const product = await adminProductsRepo.update(id, {
      ...data,
      ...(data.categoryId ? { category: { connect: { id: data.categoryId } } } : {}),
      ...(data.brandId ? { brand: { connect: { id: data.brandId } } } : {}),
    });
    if (images) await setProductImages(id, images);
    // Drop the cached PDP (Redis + in-process) so price/availability edits show
    // immediately instead of waiting out the 120s TTL.
    await productsService.invalidate(product.slug);
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}`);
    return product;
  },
);

export const deleteProduct = withAction(async (input: { id: string }) => {
  await requireAdmin();
  // delete() returns the removed row, so we still have its slug to invalidate.
  const product = await adminProductsRepo.delete(input.id);
  await productsService.invalidate(product.slug);
  revalidatePath('/admin/products');
  return { id: input.id };
});

export const updateStock = withAction(
  async (input: { variantId: string; stockQuantity: number }) => {
    await requireAdmin();
    const stockQuantity = Math.max(0, Math.floor(input.stockQuantity));
    const variant = await adminProductsRepo.updateVariantStock(input.variantId, stockQuantity);
    await productsService.invalidate(variant.product.slug);
    revalidatePath('/admin/products');
    return { variantId: input.variantId, stockQuantity };
  },
);

// ---------------------------------------------------------------------------
// Bulk operations
// ---------------------------------------------------------------------------

const bulkActiveBody = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  isActive: z.boolean(),
});

/** Enable/disable many products at once. */
export const bulkSetProductActive = withAction(async (input: z.infer<typeof bulkActiveBody>) => {
  await requireAdmin();
  const { ids, isActive } = bulkActiveBody.parse(input);
  const count = await adminProductsRepo.bulkSetActive(ids, isActive);
  // Invalidate the affected PDP caches so storefront reflects the change.
  const slugs = await adminProductsRepo.slugsForIds(ids);
  await Promise.all(slugs.map((s) => productsService.invalidate(s.slug)));
  revalidatePath('/admin/products');
  revalidatePath('/products');
  return { count, isActive };
});

const importRow = z.object({
  name: z.string().min(2).max(255),
  price: z.coerce.number().min(0),
  sku: z.string().max(80).optional(),
  category: z.string().max(120).optional(),
  brand: z.string().max(160).optional(),
  shortDescription: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Bulk-create/update products from parsed rows (CSV import). Matches existing
 * products by slug (derived from name): updates them, otherwise creates a new
 * product with a default sellable variant. Per-row failures are counted, not
 * fatal.
 */
export const bulkImportProducts = withAction(async (input: { rows: unknown[] }) => {
  await requireAdmin();
  const rows = z.array(importRow).min(1).max(1000).parse(input.rows);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const slug = toSlug(row.name);
      if (!slug) {
        failed++;
        continue;
      }

      let brandId: string | null = null;
      if (row.brand) {
        const b = await prisma.brand.upsert({
          where: { slug: toSlug(row.brand) },
          update: {},
          create: { name: row.brand, slug: toSlug(row.brand) },
        });
        brandId = b.id;
      }

      let categoryId: string | null = null;
      if (row.category) {
        const c = await prisma.category.upsert({
          where: { slug: toSlug(row.category) },
          update: {},
          create: { name: row.category, slug: toSlug(row.category) },
        });
        categoryId = c.id;
      }

      const common = {
        name: row.name,
        shortDescription: row.shortDescription ?? null,
        price: new Prisma.Decimal(row.price),
        isActive: row.isActive ?? true,
        brandId,
        categoryId,
      };

      const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
      let productId: string;

      if (existing) {
        // Don't touch sku on update (avoids unique collisions).
        await prisma.product.update({ where: { id: existing.id }, data: common });
        productId = existing.id;
        updated++;
      } else {
        const sku = (row.sku?.trim() || `IMP-${slug}`).slice(0, 80);
        const product = await prisma.product.create({ data: { ...common, slug, sku } });
        productId = product.id;
        // A default variant so the product is immediately sellable.
        await prisma.productVariant.create({
          data: {
            productId,
            sku: `${sku}-V`.slice(0, 80),
            price: common.price,
            stockQuantity: row.stock ?? 0,
          },
        });
        created++;
      }

      if (row.imageUrl) {
        await prisma.productImage.deleteMany({ where: { productId, isPrimary: true } });
        await prisma.productImage.create({
          data: {
            productId,
            imageUrl: row.imageUrl,
            isPrimary: true,
            sortOrder: 0,
            altText: row.name,
          },
        });
      }

      await productsService.invalidate(slug);
    } catch {
      failed++;
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  return { created, updated, failed };
});
