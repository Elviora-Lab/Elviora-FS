/**
 * Seed script — idempotent. Run with `npm run db:seed`.
 *
 * Uses upserts so it can be safely re-run against any environment.
 * Populates the catalog with a minimal set of brand-defining records:
 *  • admin & one customer account
 *  • core categories (Skincare / Makeup / Fragrance)
 *  • skincare concerns vocabulary
 *  • a handful of hero ingredients
 *  • one sample brand + product with variants
 *  • initial system settings
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // — Admin operator —
  await prisma.adminUser.upsert({
    where: { email: 'admin@elviora.com' },
    update: {},
    create: {
      name: 'Elviora Concierge',
      email: 'admin@elviora.com',
      // bcrypt hash of "ChangeMe!123" — replace in production seed.
      passwordHash: '$2b$10$D5PqGmZGzg.SkjjLN6gC/uYxRJ.l0w0t6oJxxxxxxxxxxxxxxxxxx',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // — Demo customer —
  await prisma.user.upsert({
    where: { email: 'demo@elviora.com' },
    update: {},
    create: {
      firstName: 'Demo',
      lastName: 'Customer',
      email: 'demo@elviora.com',
      passwordHash: '$2b$10$D5PqGmZGzg.SkjjLN6gC/uYxRJ.l0w0t6oJxxxxxxxxxxxxxxxxxx',
      role: 'CUSTOMER',
      isVerified: true,
    },
  });

  // — Categories —
  const skincare = await prisma.category.upsert({
    where: { slug: 'skincare' },
    update: {},
    create: { name: 'Skincare', slug: 'skincare', sortOrder: 1 },
  });
  await prisma.category.upsert({
    where: { slug: 'makeup' },
    update: {},
    create: { name: 'Makeup', slug: 'makeup', sortOrder: 2 },
  });
  await prisma.category.upsert({
    where: { slug: 'fragrance' },
    update: {},
    create: { name: 'Fragrance', slug: 'fragrance', sortOrder: 3 },
  });
  const serums = await prisma.category.upsert({
    where: { slug: 'serums' },
    update: {},
    create: { name: 'Serums', slug: 'serums', parentId: skincare.id, sortOrder: 2 },
  });

  // — Skin concerns —
  const concerns = [
    ['Hydration', 'hydration'],
    ['Anti-Aging', 'anti-aging'],
    ['Brightening', 'brightening'],
    ['Acne & Blemishes', 'acne-blemishes'],
    ['Sensitivity', 'sensitivity'],
    ['Hyperpigmentation', 'hyperpigmentation'],
    ['Pores & Texture', 'pores-texture'],
  ];
  for (const [name, slug] of concerns) {
    await prisma.skinConcern.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }

  // — Hero ingredients —
  const ingredients = [
    ['Niacinamide', 'niacinamide', 'Vitamin B3 — refines pores, evens tone.'],
    ['Hyaluronic Acid', 'hyaluronic-acid', 'Humectant — holds 1000x its weight in water.'],
    ['Retinol', 'retinol', 'Vitamin A — accelerates cell turnover.'],
    ['Vitamin C', 'vitamin-c', 'Antioxidant — brightens and protects.'],
    ['Bakuchiol', 'bakuchiol', 'Plant-based retinol alternative.'],
  ];
  for (const [name, slug, description] of ingredients) {
    await prisma.ingredient.upsert({
      where: { slug },
      update: {},
      create: { name, slug, description },
    });
  }

  // — Brand & one sample product with variants —
  const brand = await prisma.brand.upsert({
    where: { slug: 'elviora' },
    update: {},
    create: {
      name: 'Elviora',
      slug: 'elviora',
      description: 'The house — quietly powerful skincare.',
    },
  });

  const product = await prisma.product.upsert({
    where: { slug: 'lumiere-vitamin-c-serum' },
    update: {},
    create: {
      name: 'Lumière Vitamin C Serum',
      slug: 'lumiere-vitamin-c-serum',
      sku: 'ELV-SER-VC-001',
      shortDescription: 'Editorial-grade brightening serum with 15% stabilized Vitamin C.',
      fullDescription:
        'A daily ritual that revives radiance — 15% L-Ascorbic Acid, ferulic acid, and bakuchiol in a silken, fast-absorbing emulsion.',
      price: 89.0,
      comparePrice: 110.0,
      costPrice: 22.0,
      isFeatured: true,
      categoryId: serums.id,
      brandId: brand.id,
      seoTitle: 'Lumière Vitamin C Serum — Elviora',
      seoDescription: 'Brighten and refine with our flagship Vitamin C serum.',
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'ELV-SER-VC-001-30' },
    update: {},
    create: {
      productId: product.id,
      size: '30ml',
      sku: 'ELV-SER-VC-001-30',
      price: 89.0,
      stockQuantity: 120,
      weight: 0.12,
    },
  });
  await prisma.productVariant.upsert({
    where: { sku: 'ELV-SER-VC-001-50' },
    update: {},
    create: {
      productId: product.id,
      size: '50ml',
      sku: 'ELV-SER-VC-001-50',
      price: 130.0,
      stockQuantity: 80,
      weight: 0.18,
    },
  });

  // — System settings —
  const settings = [
    ['site.currency.default', { value: 'USD' }],
    ['shipping.free_threshold', { value: 75 }],
    ['loyalty.points_per_dollar', { value: 5 }],
  ] as const;
  for (const [key, value] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
