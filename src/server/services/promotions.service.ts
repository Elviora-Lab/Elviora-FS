import 'server-only';

import { prisma } from '@/lib/db';
import { computeSpendDiscount, type SpendTier } from '@/lib/promotions';

const ENABLED_KEY = 'spend_discount.enabled';

/**
 * "Spend & Save" server helpers — the source of truth for the automatic tiered
 * discount. Loads admin-managed tiers + the master toggle, and computes the
 * authoritative discount for an order subtotal.
 */
export const promotionsService = {
  /** Master switch — defaults ON unless explicitly set to "false". */
  async isEnabled(): Promise<boolean> {
    const row = await prisma.appSetting.findUnique({ where: { key: ENABLED_KEY } });
    return row?.value !== 'false';
  },

  async setEnabled(enabled: boolean): Promise<void> {
    await prisma.appSetting.upsert({
      where: { key: ENABLED_KEY },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: ENABLED_KEY, value: enabled ? 'true' : 'false' },
    });
  },

  /** All tiers (incl. inactive) for the admin manager, ascending. */
  allTiers() {
    return prisma.spendDiscountTier.findMany({ orderBy: { minSubtotal: 'asc' } });
  },

  /** Active tiers as plain numbers, ascending. */
  async activeTiers(): Promise<SpendTier[]> {
    const rows = await prisma.spendDiscountTier.findMany({
      where: { isActive: true },
      orderBy: { minSubtotal: 'asc' },
    });
    return rows.map((r) => ({
      minSubtotal: Number(r.minSubtotal),
      discountAmount: Number(r.discountAmount),
    }));
  },

  /** Tiers to expose to the storefront — empty when the feature is off. */
  async tiersForDisplay(): Promise<SpendTier[]> {
    if (!(await this.isEnabled())) return [];
    return this.activeTiers();
  },

  /**
   * Authoritative spend discount for a subtotal: 0 when disabled or no tier is
   * reached. Callers compare this with any coupon and apply the larger.
   */
  async computeDiscount(subtotal: number): Promise<number> {
    if (!(await this.isEnabled())) return 0;
    return computeSpendDiscount(subtotal, await this.activeTiers());
  },
};
