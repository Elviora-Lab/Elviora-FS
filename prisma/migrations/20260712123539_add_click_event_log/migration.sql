-- CreateTable
CREATE TABLE "click_event_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "guest_id" VARCHAR(64),
    "target_type" VARCHAR(24) NOT NULL,
    "target_id" VARCHAR(128),
    "label" VARCHAR(160),
    "href" VARCHAR(512),
    "page_path" VARCHAR(512) NOT NULL,
    "position" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "click_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "click_event_logs_created_at_idx" ON "click_event_logs"("created_at");

-- CreateIndex
CREATE INDEX "click_event_logs_target_type_created_at_idx" ON "click_event_logs"("target_type", "created_at");

-- CreateIndex
CREATE INDEX "click_event_logs_target_id_created_at_idx" ON "click_event_logs"("target_id", "created_at");

-- CreateIndex
CREATE INDEX "click_event_logs_user_id_created_at_idx" ON "click_event_logs"("user_id", "created_at");
