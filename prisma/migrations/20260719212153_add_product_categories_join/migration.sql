-- Many-to-many product↔category membership.
--
-- `products.category_id` stays the PRIMARY category (breadcrumbs, feeds, admin
-- edit form). This table carries the FULL set, primary included, so listing
-- queries filter on it alone rather than unioning the scalar column.
--
-- NOTE: Prisma's diff wanted to DROP INDEX "products_name_trgm_idx" here. That
-- is the raw-SQL trigram GIN index from 20260719010000 which Prisma cannot
-- express, so every generated migration will try to drop it. Deliberately
-- omitted — dropping it silently degrades fuzzy product search to a seq scan.

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_categories_category_id_idx" ON "product_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_category" ON "product_categories"("product_id", "category_id");

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every product with a primary category gets a membership row, so
-- the join table is authoritative from the moment it exists and listing
-- queries never need to fall back to products.category_id.
INSERT INTO "product_categories" ("product_id", "category_id")
SELECT "id", "category_id" FROM "products" WHERE "category_id" IS NOT NULL
-- Target the columns, not the constraint name: uq_product_category is a unique
-- INDEX (CREATE UNIQUE INDEX above), and ON CONFLICT ON CONSTRAINT only
-- resolves true constraints.
ON CONFLICT ("product_id", "category_id") DO NOTHING;
