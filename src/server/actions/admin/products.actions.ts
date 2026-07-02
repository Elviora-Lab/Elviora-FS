'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { toSlug } from '@/utils/slug';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
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
  // `null` clears the category (the form's "No category" option); `undefined`
  // leaves it untouched.
  categoryId: z.string().uuid().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
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
  // A product needs at least one variant to be purchasable — start with a
  // default one mirroring the product SKU/price (stock 0 until set). Skipped
  // silently on a variant-SKU collision; the operator can add variants below.
  await prisma.productVariant
    .create({
      data: {
        productId: product.id,
        sku: `${product.sku}-V`.slice(0, 80),
        price: data.price,
        stockQuantity: 0,
      },
    })
    .catch(() => {});
  revalidatePath('/admin/products');
  return product;
});

export const updateProduct = withAction(
  async (input: { id: string } & Partial<z.infer<typeof productBody>>) => {
    await requireAdmin();
    const { id, ...rest } = input;
    // The scalar FKs must not leak into the checked update input — Prisma
    // rejects `categoryId` alongside the nested `category` operation.
    const { images, categoryId, brandId, ...data } = productBody.partial().parse(rest);
    const product = await adminProductsRepo.update(id, {
      ...data,
      ...(categoryId !== undefined
        ? { category: categoryId ? { connect: { id: categoryId } } : { disconnect: true } }
        : {}),
      ...(brandId !== undefined
        ? { brand: brandId ? { connect: { id: brandId } } : { disconnect: true } }
        : {}),
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

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** '' → null so clearing a size/shade field actually clears the column. */
const optionalLabel = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z.string().trim().max(64).nullable().optional(),
);

const variantBody = z.object({
  productId: z.string().uuid(),
  sku: z.string().trim().min(2).max(80),
  price: z.coerce.number().min(0),
  size: optionalLabel,
  shade: optionalLabel,
  fragrance: optionalLabel,
  stockQuantity: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().optional(),
});

export const createVariant = withAction(async (input: z.infer<typeof variantBody>) => {
  await requireAdmin();
  const { productId, ...data } = variantBody.parse(input);
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (!product) throw new NotFoundError('Product not found');

  const variant = await prisma.productVariant.create({ data: { productId, ...data } });
  await productsService.invalidate(product.slug);
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${product.slug}`);
  return { id: variant.id };
});

const variantUpdateBody = variantBody.omit({ productId: true }).partial();

export const updateVariant = withAction(
  async (input: { id: string } & z.infer<typeof variantUpdateBody>) => {
    await requireAdmin();
    const { id, ...rest } = input;
    const data = variantUpdateBody.parse(rest);
    const variant = await prisma.productVariant.update({
      where: { id },
      data,
      include: { product: { select: { slug: true } } },
    });
    await productsService.invalidate(variant.product.slug);
    revalidatePath(`/admin/products/${variant.productId}`);
    revalidatePath(`/products/${variant.product.slug}`);
    return { id: variant.id };
  },
);

export const deleteVariant = withAction(async (input: { id: string }) => {
  await requireAdmin();
  const id = z.string().uuid().parse(input.id);

  // Variants referenced by past orders keep the sales history readable —
  // deactivate those instead of deleting.
  const orderRefs = await prisma.orderItem.count({ where: { variantId: id } });
  if (orderRefs > 0) {
    throw new BadRequestError('This variant has order history — deactivate it instead.');
  }

  const variant = await prisma.productVariant.delete({
    where: { id },
    include: { product: { select: { slug: true } } },
  });
  await productsService.invalidate(variant.product.slug);
  revalidatePath(`/admin/products/${variant.productId}`);
  revalidatePath(`/products/${variant.product.slug}`);
  return { id };
});

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
  // Bust each product's ISR page cache too, so hiding 404s immediately and
  // re-activating makes it publicly visible without waiting out the revalidate.
  for (const s of slugs) revalidatePath(`/products/${s.slug}`);
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
