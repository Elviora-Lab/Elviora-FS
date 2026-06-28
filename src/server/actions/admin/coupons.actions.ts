'use server';

import { revalidatePath } from 'next/cache';
import { DiscountType, Prisma } from '@prisma/client';
import { z } from 'zod';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { BadRequestError } from '@/server/http/errors';
import { adminCouponsRepo } from '@/server/repositories/coupons.repo';

const createBody = z.object({
  code: z
    .string()
    .min(3)
    .max(64)
    .transform((s) => s.trim().toUpperCase()),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().min(0),
  minimumOrderAmount: z.coerce.number().min(0).optional(),
  maximumDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const createCoupon = withAction(async (input: z.infer<typeof createBody>) => {
  await requireAdmin();
  const data = createBody.parse(input);

  if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
    throw new BadRequestError('A percentage discount cannot exceed 100');
  }
  if (await adminCouponsRepo.findByCode(data.code)) {
    throw new BadRequestError('A coupon with that code already exists');
  }

  const coupon = await adminCouponsRepo.create({
    code: data.code,
    discountType: data.discountType,
    discountValue: new Prisma.Decimal(data.discountValue),
    minimumOrderAmount:
      data.minimumOrderAmount != null ? new Prisma.Decimal(data.minimumOrderAmount) : null,
    maximumDiscount: data.maximumDiscount != null ? new Prisma.Decimal(data.maximumDiscount) : null,
    usageLimit: data.usageLimit ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive ?? true,
  });

  revalidatePath('/admin/coupons');
  return { id: coupon.id, code: coupon.code };
});

export const toggleCoupon = withAction(async (input: { id: string; isActive: boolean }) => {
  await requireAdmin();
  await adminCouponsRepo.setActive(input.id, input.isActive);
  revalidatePath('/admin/coupons');
  return { id: input.id, isActive: input.isActive };
});

export const deleteCoupon = withAction(async (input: { id: string }) => {
  await requireAdmin();
  await adminCouponsRepo.delete(input.id);
  revalidatePath('/admin/coupons');
  return { id: input.id };
});
