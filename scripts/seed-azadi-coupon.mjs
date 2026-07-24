/**
 * Seed / update the Azadi Sale coupon (AZADI10 — 10% off, Aug 1–15 2026).
 *
 * The coupon only becomes usable at checkout during its start/expiry window, so
 * running this ahead of time is safe — it stays dormant until 1 August.
 *
 * Usage:  node scripts/seed-azadi-coupon.mjs
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CODE = 'AZADI10';
const STARTS_AT = new Date('2026-08-01T00:00:00+05:00');
const EXPIRES_AT = new Date('2026-08-15T23:59:59+05:00');

const data = {
  discountType: 'PERCENTAGE',
  discountValue: 10,
  startsAt: STARTS_AT,
  expiresAt: EXPIRES_AT,
  isActive: true,
  // Store-wide sale — no minimum, no per-order cap, unlimited redemptions.
  minimumOrderAmount: null,
  maximumDiscount: null,
  usageLimit: null,
};

const coupon = await prisma.coupon.upsert({
  where: { code: CODE },
  update: data,
  create: { code: CODE, ...data },
});

console.log(
  `✓ ${coupon.code} — ${coupon.discountValue}% off | ` +
    `${coupon.startsAt?.toISOString()} → ${coupon.expiresAt?.toISOString()} | active=${coupon.isActive}`,
);

await prisma.$disconnect();
