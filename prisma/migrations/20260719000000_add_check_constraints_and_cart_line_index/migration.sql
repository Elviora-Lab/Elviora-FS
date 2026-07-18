-- The schema comments have always claimed CHECK constraints for non-negative
-- pricing, 1-5 star ratings, positive quantities, and cart ownership — but the
-- init migration never created them. Add them now so bulk imports, admin
-- tooling, and future endpoints can't corrupt data the app assumes is valid.

-- ---------------------------------------------------------------------------
-- Products / variants — non-negative pricing and stock.
-- ---------------------------------------------------------------------------
ALTER TABLE "products"
  ADD CONSTRAINT "ck_products_price_nonneg" CHECK ("price" >= 0),
  ADD CONSTRAINT "ck_products_compare_price_nonneg" CHECK ("compare_price" IS NULL OR "compare_price" >= 0),
  ADD CONSTRAINT "ck_products_cost_price_nonneg" CHECK ("cost_price" IS NULL OR "cost_price" >= 0);

ALTER TABLE "product_variants"
  ADD CONSTRAINT "ck_variants_price_nonneg" CHECK ("price" >= 0),
  ADD CONSTRAINT "ck_variants_stock_nonneg" CHECK ("stock_quantity" >= 0);

-- ---------------------------------------------------------------------------
-- Reviews — star rating is 1-5.
-- ---------------------------------------------------------------------------
ALTER TABLE "reviews"
  ADD CONSTRAINT "ck_reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

-- ---------------------------------------------------------------------------
-- Cart / order lines — positive quantities, non-negative money.
-- ---------------------------------------------------------------------------
ALTER TABLE "cart_items"
  ADD CONSTRAINT "ck_cart_items_quantity_pos" CHECK ("quantity" > 0),
  ADD CONSTRAINT "ck_cart_items_price_nonneg" CHECK ("price" >= 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "ck_order_items_quantity_pos" CHECK ("quantity" > 0),
  ADD CONSTRAINT "ck_order_items_unit_price_nonneg" CHECK ("unit_price" >= 0),
  ADD CONSTRAINT "ck_order_items_total_price_nonneg" CHECK ("total_price" >= 0);

-- ---------------------------------------------------------------------------
-- Carts — a cart belongs to a user XOR a guest session, never both/neither.
-- The app already maintains this (claiming a guest cart nulls session_id);
-- normalize any legacy rows before enforcing it.
-- ---------------------------------------------------------------------------
UPDATE "carts" SET "session_id" = NULL
WHERE "user_id" IS NOT NULL AND "session_id" IS NOT NULL;

-- Rows with neither key are unreachable by the app — drop them (cart_items
-- cascade).
DELETE FROM "carts" WHERE "user_id" IS NULL AND "session_id" IS NULL;

ALTER TABLE "carts"
  ADD CONSTRAINT "ck_carts_owner_xor" CHECK (("user_id" IS NULL) <> ("session_id" IS NULL));

-- ---------------------------------------------------------------------------
-- Cart lines with no variant — "uq_cart_line" (cart_id, product_id, variant_id)
-- never fires when variant_id IS NULL (NULLs are distinct in Postgres), so
-- duplicate no-variant lines were possible. Merge any existing duplicates into
-- one line, then enforce uniqueness with a partial index.
-- ---------------------------------------------------------------------------
WITH dupes AS (
  SELECT (array_agg("id" ORDER BY "id"))[1] AS keep_id, SUM("quantity") AS total_qty
  FROM "cart_items"
  WHERE "variant_id" IS NULL
  GROUP BY "cart_id", "product_id"
  HAVING COUNT(*) > 1
)
UPDATE "cart_items" ci
SET "quantity" = d.total_qty
FROM dupes d
WHERE ci."id" = d.keep_id;

WITH dupes AS (
  SELECT (array_agg("id" ORDER BY "id"))[1] AS keep_id, "cart_id", "product_id"
  FROM "cart_items"
  WHERE "variant_id" IS NULL
  GROUP BY "cart_id", "product_id"
  HAVING COUNT(*) > 1
)
DELETE FROM "cart_items" ci
USING dupes d
WHERE ci."variant_id" IS NULL
  AND ci."cart_id" = d."cart_id"
  AND ci."product_id" = d."product_id"
  AND ci."id" <> d.keep_id;

-- CreateIndex (partial unique: one no-variant line per cart+product)
CREATE UNIQUE INDEX "uq_cart_line_no_variant" ON "cart_items" ("cart_id", "product_id")
WHERE "variant_id" IS NULL;
