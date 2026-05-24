-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shipping_address_line_1" VARCHAR(255),
ADD COLUMN     "shipping_address_line_2" VARCHAR(255),
ADD COLUMN     "shipping_area" VARCHAR(160),
ADD COLUMN     "shipping_city" VARCHAR(120),
ADD COLUMN     "shipping_country" VARCHAR(2),
ADD COLUMN     "shipping_full_name" VARCHAR(160),
ADD COLUMN     "shipping_phone" VARCHAR(32),
ADD COLUMN     "shipping_postal_code" VARCHAR(20),
ALTER COLUMN "currency" SET DEFAULT 'PKR';
