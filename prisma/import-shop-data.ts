/**
 * Importer — loads the scraped catalog in `data/products.json` into Postgres.
 *
 * Run with `npm run db:import`. Idempotent: products/categories/brand/reviews are
 * upserted; variants are inserted with skipDuplicates (unique SKU); a product's
 * images are replaced on each run.
 *
 * `data/products.json` already contains only the 266 products that have images,
 * each with nested `variants`, `images`, and `reviews`. The source has no real
 * SKUs or stock counts, so we synthesize stable SKUs from the Shopify ids and
 * default stock from each variant's `available` flag. Scraped reviews have a
 * name but no account, so we create one synthetic user per reviewer.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Source types (only the fields we use)
// ---------------------------------------------------------------------------
type SourceVariant = {
  variant_id: number;
  price: number | null;
  compare_at_price: number | null;
  color: string | null;
  shade: string | null;
  size: string | null;
  weight: number | null;
  available: boolean | null;
};
type SourceImage = {
  image_id: number;
  url: string;
  alt_text: string | null;
  position: number | null;
  image_type: string | null;
  variant_ids?: number[];
};
type SourceReview = {
  review_id: string;
  user_name: string | null;
  rating: number | null;
  title: string | null;
  review_text: string | null;
  verified_purchase: boolean | null;
  date: string | null;
};
type SourceProduct = {
  product_id: number;
  handle: string;
  product_name: string;
  brand: string | null;
  categories: string[] | null;
  current_price: number | null;
  compare_at_price: number | null;
  description_plain: string | null;
  meta_title: string | null;
  meta_description: string | null;
  bestseller: boolean | null;
  featured: boolean | null;
  published_at: string | null;
  created_at: string | null;
  variants: SourceVariant[];
  images: SourceImage[];
  reviews: SourceReview[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const truncate = (s: string | null | undefined, max: number) => (s ? s.trim().slice(0, max) : null);

const dec = (n: number | null | undefined) => (n == null ? null : new Prisma.Decimal(n.toFixed(2)));

const clampRating = (r: number | null | undefined) =>
  Math.min(5, Math.max(1, Math.round(r ?? 0))) || 1;

// Prefer a real product-type category over merchandising collections.
const CATEGORY_PRIORITY = ['Lips', 'Eyes', 'Face', 'Nails'];
function pickCategory(categories: string[] | null): string | null {
  if (!categories?.length) return null;
  return CATEGORY_PRIORITY.find((c) => categories.includes(c)) ?? categories[0] ?? null;
}

const parseDate = (s: string | null | undefined) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Minimal CSV line parser (quoted fields, "" escapes) — enough for the small
// crawl-metadata files in data/.
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

/** handle → banner image URL from the scraped collections metadata. */
function loadCategoryImages(): Map<string, string> {
  const images = new Map<string, string>();
  let csv: string;
  try {
    csv = readFileSync(join(process.cwd(), 'data', 'collections.csv'), 'utf8');
  } catch {
    return images; // optional file — categories just stay imageless
  }
  const [header, ...rows] = csv.split(/\r?\n/).filter(Boolean);
  const cols = parseCsvLine(header);
  const handleIdx = cols.indexOf('handle');
  const imageIdx = cols.indexOf('image_url');
  if (handleIdx === -1 || imageIdx === -1) return images;
  for (const row of rows) {
    const fields = parseCsvLine(row);
    const handle = fields[handleIdx]?.trim();
    const url = fields[imageIdx]?.trim();
    if (handle && url) images.set(slugify(handle), url);
  }
  return images;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------
async function main() {
  const raw = readFileSync(join(process.cwd(), 'data', 'products.json'), 'utf8');
  const products = JSON.parse(raw) as SourceProduct[];
  console.log(`Loaded ${products.length} products from data/products.json`);

  // 1. Brand — the dataset is a single house under varying name strings.
  const brand = await prisma.brand.upsert({
    where: { slug: 'she-beauty' },
    update: {},
    create: { name: 'She Beauty', slug: 'she-beauty', isActive: true },
  });

  // 2. Categories — one per distinct category string in the dataset, with the
  // source collection banner (when the crawl captured one) as the image.
  const categoryImages = loadCategoryImages();
  const categoryNames = [...new Set(products.flatMap((p) => p.categories ?? []))];
  const categoryIdBySlug = new Map<string, string>();
  for (const [i, name] of categoryNames.entries()) {
    const slug = slugify(name);
    const image = categoryImages.get(slug);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name, ...(image ? { image } : {}) },
      create: { name, slug, sortOrder: i, isActive: true, image },
    });
    categoryIdBySlug.set(name, cat.id);
  }
  console.log(`Upserted brand + ${categoryNames.length} categories`);

  // 3. Synthetic reviewer cache — one user per distinct reviewer name.
  const userIdByKey = new Map<string, string>();
  async function reviewerUserId(name: string | null): Promise<string> {
    const display = (name ?? '').trim() || 'Anonymous';
    const key = slugify(display) || 'anonymous';
    const cached = userIdByKey.get(key);
    if (cached) return cached;
    const email = `${key}@reviews.elviora.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        firstName: display.slice(0, 80),
        passwordHash: 'imported',
        role: 'CUSTOMER',
      },
    });
    userIdByKey.set(key, user.id);
    return user.id;
  }

  let pCount = 0;
  let vCount = 0;
  let iCount = 0;
  let rCount = 0;

  for (const p of products) {
    const slug = slugify(p.handle || p.product_name);
    const categoryName = pickCategory(p.categories);
    const categoryId = categoryName ? categoryIdBySlug.get(categoryName) : undefined;
    const price = dec(p.current_price) ?? new Prisma.Decimal(0);
    const compareAt =
      p.compare_at_price && p.compare_at_price > (p.current_price ?? 0)
        ? dec(p.compare_at_price)
        : null;

    // Source publish date → createdAt, so "newest" sorting and the "New"
    // badge reflect the shop's real timeline instead of the import moment.
    const publishedAt = parseDate(p.published_at) ?? parseDate(p.created_at);

    const productData = {
      name: truncate(p.product_name, 255) ?? p.handle,
      shortDescription: truncate(p.meta_description ?? p.description_plain, 500),
      fullDescription: p.description_plain?.trim() || null,
      price,
      comparePrice: compareAt,
      isFeatured: Boolean(p.bestseller || p.featured),
      seoTitle: truncate(p.meta_title, 255),
      seoDescription: truncate(p.meta_description, 500),
      brandId: brand.id,
      categoryId: categoryId ?? null,
      ...(publishedAt ? { createdAt: publishedAt } : {}),
    };

    const product = await prisma.product.upsert({
      where: { slug },
      // `isActive` is admin-managed (operators hide products from the
      // storefront) — set it on create only so re-imports never unhide.
      update: productData,
      create: { ...productData, isActive: true, slug, sku: `SB-P-${p.product_id}` },
    });
    pCount++;

    // Variants — synthesize SKUs; default stock from availability.
    if (p.variants.length) {
      const res = await prisma.productVariant.createMany({
        data: p.variants.map((v) => ({
          productId: product.id,
          sku: `SB-V-${v.variant_id}`,
          price: dec(v.price) ?? price,
          stockQuantity: v.available ? 100 : 0,
          size: truncate(v.size, 64),
          shade: truncate(v.shade ?? v.color, 64),
          weight: v.weight ? new Prisma.Decimal(v.weight) : null,
          isActive: v.available !== false,
        })),
        skipDuplicates: true,
      });
      vCount += res.count;
    }

    // Map source variant ids → DB variant ids so images can link to the
    // variant they depict (drives the "show the selected shade" gallery).
    const dbVariants = await prisma.productVariant.findMany({
      where: { productId: product.id },
      select: { id: true, sku: true },
    });
    const variantIdBySku = new Map(dbVariants.map((v) => [v.sku, v.id]));

    // Images — replace on each run (no FK references into product_images).
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    if (p.images.length) {
      const res = await prisma.productImage.createMany({
        data: p.images.map((img, idx) => {
          const sourceVariantId = img.variant_ids?.[0];
          const variantId = sourceVariantId
            ? (variantIdBySku.get(`SB-V-${sourceVariantId}`) ?? null)
            : null;
          return {
            productId: product.id,
            variantId,
            imageUrl: img.url,
            altText: truncate(img.alt_text ?? p.product_name, 255),
            isPrimary: img.image_type === 'primary' || img.position === 1,
            sortOrder: img.position ?? idx,
          };
        }),
      });
      iCount += res.count;
    }

    // Reviews — attach to a synthetic user; dedupe on (user, product).
    for (const rv of p.reviews) {
      const userId = await reviewerUserId(rv.user_name);
      const date = rv.date ? new Date(rv.date) : null;
      await prisma.review.upsert({
        where: { userId_productId: { userId, productId: product.id } },
        update: {},
        create: {
          userId,
          productId: product.id,
          rating: clampRating(rv.rating),
          title: truncate(rv.title, 200),
          comment: rv.review_text?.trim() || null,
          isVerifiedPurchase: Boolean(rv.verified_purchase),
          isApproved: true,
          ...(date && !Number.isNaN(date.getTime()) ? { createdAt: date } : {}),
        },
      });
      rCount++;
    }
  }

  console.log(
    `Imported: ${pCount} products, ${vCount} variants, ${iCount} images, ${rCount} reviews ` +
      `(across ${userIdByKey.size} synthetic reviewers)`,
  );
  console.log(
    'Note: products are (re)assigned to top-level categories — run ' +
      '`npm run db:seed:subcategories` to distribute them into subcategories.',
  );
}

main()
  .catch((err) => {
    console.error('[import] failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
