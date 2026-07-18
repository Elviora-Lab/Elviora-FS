import 'server-only';

import { type Coupon, Prisma } from '@prisma/client';

import { BadRequestError } from '@/server/http/errors';
import { couponsRepo } from '@/server/repositories/coupons.repo';

export type CouponEvaluation = {
  coupon: Coupon;
  discount: Prisma.Decimal;
};

/** Compute the money discount for a coupon against a subtotal. */
function computeDiscount(coupon: Coupon, subtotal: Prisma.Decimal): Prisma.Decimal {
  let discount = new Prisma.Decimal(0);

  if (coupon.discountType === 'PERCENTAGE') {
    discount = subtotal.mul(coupon.discountValue).div(100);
    if (coupon.maximumDiscount) {
      discount = Prisma.Decimal.min(discount, coupon.maximumDiscount);
    }
  } else if (coupon.discountType === 'FIXED') {
    discount = new Prisma.Decimal(coupon.discountValue);
  }
  // FREE_SHIPPING applies to shipping, not line items → no item discount here.

  // Never discount more than the subtotal; round to currency precision.
  discount = Prisma.Decimal.min(discount, subtotal);
  return discount.toDecimalPlaces(2);
}

export const couponsService = {
  /**
   * Validate a coupon against a subtotal and return the computed discount.
   * Throws {@link BadRequestError} with a human reason when invalid. This is a
   * read-only check — the usage count is incremented atomically at order time
   * (see ordersService.createFromCart). Pass `db` to evaluate inside an open
   * transaction so the coupon state read is serialized with its redemption.
   */
  async evaluate(
    code: string,
    subtotal: Prisma.Decimal | number,
    db?: Prisma.TransactionClient,
  ): Promise<CouponEvaluation> {
    const sub = new Prisma.Decimal(subtotal);
    const coupon = await couponsRepo.findActiveByCode(code, db);
    if (!coupon) throw new BadRequestError('Invalid or expired coupon');

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestError('This coupon is not active yet');
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestError('This coupon has expired');
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestError('This coupon has reached its usage limit');
    }
    if (coupon.minimumOrderAmount && sub.lessThan(coupon.minimumOrderAmount)) {
      throw new BadRequestError(
        `Spend at least ${coupon.minimumOrderAmount.toString()} to use this coupon`,
      );
    }

    return { coupon, discount: computeDiscount(coupon, sub) };
  },
};
