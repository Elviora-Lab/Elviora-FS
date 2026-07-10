-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "discount_label" VARCHAR(64);

-- CreateTable
CREATE TABLE "spend_discount_tiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "min_subtotal" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "spend_discount_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" VARCHAR(64) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "spend_discount_tiers_is_active_min_subtotal_idx" ON "spend_discount_tiers"("is_active", "min_subtotal");

-- Seed the initial Spend & Save tiers (admin-editable thereafter).
INSERT INTO "spend_discount_tiers" ("id", "min_subtotal", "discount_amount", "is_active", "updated_at") VALUES
  (gen_random_uuid(), 1000, 50,  true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 1500, 100, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 2000, 175, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 2500, 250, true, CURRENT_TIMESTAMP);

-- Master switch on by default.
INSERT INTO "app_settings" ("key", "value", "updated_at") VALUES
  ('spend_discount.enabled', 'true', CURRENT_TIMESTAMP);
