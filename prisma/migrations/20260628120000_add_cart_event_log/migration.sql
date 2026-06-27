-- CreateTable
CREATE TABLE "cart_event_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cart_event_logs_product_id_created_at_idx" ON "cart_event_logs"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "cart_event_logs_user_id_created_at_idx" ON "cart_event_logs"("user_id", "created_at");
