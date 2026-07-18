-- Analytics + catalog indexes the query patterns already rely on.
-- Names follow Prisma's default convention (<table>_<columns>_idx) so
-- `prisma migrate diff` stays clean against the schema's @@index entries.

-- Newsletter growth charts scan by subscription date.
CREATE INDEX "newsletter_subscribers_subscribed_at_idx" ON "newsletter_subscribers"("subscribed_at");

-- Funnel counts scan pure time windows (no product/user predicate).
CREATE INDEX "product_view_logs_viewed_at_idx" ON "product_view_logs"("viewed_at");
CREATE INDEX "cart_event_logs_created_at_idx" ON "cart_event_logs"("created_at");

-- Geographic sales breakdowns (admin analytics).
CREATE INDEX "orders_shipping_city_idx" ON "orders"("shipping_city");
CREATE INDEX "orders_shipping_area_idx" ON "orders"("shipping_area");

-- Price-range filters on the catalog listing.
CREATE INDEX "products_price_idx" ON "products"("price");

-- Fuzzy product-name search (ILIKE '%q%') — trigram GIN. Prisma cannot express
-- this, hence raw SQL. pg_trgm ships with Postgres (and is enabled on
-- Supabase); IF NOT EXISTS keeps re-runs safe.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
