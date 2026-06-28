-- AlterTable: track abandoned-cart recovery emails
ALTER TABLE "carts" ADD COLUMN "reminder_sent_at" TIMESTAMPTZ;
