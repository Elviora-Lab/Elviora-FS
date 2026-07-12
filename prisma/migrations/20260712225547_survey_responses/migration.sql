-- CreateTable
CREATE TABLE "survey_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" VARCHAR(32) NOT NULL,
    "question" VARCHAR(64) NOT NULL,
    "answer" VARCHAR(500) NOT NULL,
    "user_id" UUID,
    "guest_id" VARCHAR(64),
    "order_id" UUID,
    "page_path" VARCHAR(512),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "survey_responses_kind_created_at_idx" ON "survey_responses"("kind", "created_at");

-- CreateIndex
CREATE INDEX "survey_responses_question_answer_idx" ON "survey_responses"("question", "answer");

