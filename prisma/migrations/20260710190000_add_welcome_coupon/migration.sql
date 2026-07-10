-- First-order welcome incentive for the newsletter capture. 10% off, capped at
-- Rs 500, min order Rs 1000. Editable / disableable in /admin/coupons.
-- Idempotent: does nothing if a WELCOME10 code already exists.
INSERT INTO "coupons" (
  "id", "code", "discount_type", "discount_value",
  "minimum_order_amount", "maximum_discount", "is_active"
)
VALUES (gen_random_uuid(), 'WELCOME10', 'PERCENTAGE', 10, 1000, 500, true)
ON CONFLICT ("code") DO NOTHING;
