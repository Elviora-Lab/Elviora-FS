'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';

import { withAction } from '../_with-action';

import { requireAdmin } from '@/server/auth/guards';
import { promotionsService } from '@/server/services/promotions.service';

const tierBody = z
  .object({
    minSubtotal: z.coerce.number().positive().max(10_000_000),
    discountAmount: z.coerce.number().positive().max(10_000_000),
  })
  .refine((v) => v.discountAmount < v.minSubtotal, {
    message: 'Discount must be less than the spend threshold',
    path: ['discountAmount'],
  });

/** Add a Spend & Save tier. */
export const createSpendTier = withAction(async (input: z.infer<typeof tierBody>) => {
  await requireAdmin();
  const { minSubtotal, discountAmount } = tierBody.parse(input);
  await prisma.spendDiscountTier.create({ data: { minSubtotal, discountAmount } });
  revalidatePath('/admin/coupons');
  return { ok: true };
});

/** Activate / deactivate a single tier. */
export const toggleSpendTier = withAction(async (input: { id: string; isActive: boolean }) => {
  await requireAdmin();
  await prisma.spendDiscountTier.update({
    where: { id: input.id },
    data: { isActive: input.isActive },
  });
  revalidatePath('/admin/coupons');
  return { ok: true };
});

/** Delete a tier. */
export const deleteSpendTier = withAction(async (input: { id: string }) => {
  await requireAdmin();
  await prisma.spendDiscountTier.delete({ where: { id: input.id } });
  revalidatePath('/admin/coupons');
  return { ok: true };
});

/** Master switch for the whole Spend & Save feature. */
export const setSpendDiscountEnabled = withAction(async (input: { enabled: boolean }) => {
  await requireAdmin();
  await promotionsService.setEnabled(Boolean(input.enabled));
  revalidatePath('/admin/coupons');
  return { ok: true };
});
