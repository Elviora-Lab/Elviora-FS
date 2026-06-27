-- The old composite unique on (user_id, is_default) capped each user at two
-- addresses (one is_default=true row + one is_default=false row). Replace it
-- with a PARTIAL unique index so a user may have many addresses but at most
-- one marked default.

-- DropIndex
DROP INDEX IF EXISTS "uq_user_default_address";

-- CreateIndex (partial unique: only one default per user)
CREATE UNIQUE INDEX "uq_user_default_address" ON "user_addresses" ("user_id") WHERE "is_default";
