-- AlterTable
ALTER TABLE "ai_skin_assessments" ADD COLUMN     "email" VARCHAR(255);

-- CreateIndex
CREATE INDEX "ai_skin_assessments_email_idx" ON "ai_skin_assessments"("email");

