/**
 * "Spend & Save" — automatic cart-level discount tiers.
 *
 * Pure, client-safe math shared by the server (authoritative discount in
 * `ordersService.createFromCart` / `placeOrder`) and the client (the rewards
 * nudge + live totals), so the two never diverge — the same pattern as
 * `computeCheckoutTotals` in `@/lib/shipping`.
 *
 * Rules: the discount is the amount of the HIGHEST active tier whose
 * `minSubtotal` the cart subtotal reaches. It's compared against any coupon
 * elsewhere and the larger wins (best-single-wins); this module only computes
 * the spend-tier side.
 */

export type SpendTier = { minSubtotal: number; discountAmount: number };

export type SpendTierProgress = {
  /** The tier currently unlocked (highest reached), or null. */
  current: SpendTier | null;
  /** The next tier to chase, with how much more to spend, or null if maxed. */
  next: (SpendTier & { amountToNext: number }) | null;
  /** The discount currently applied (0 when no tier is reached). */
  discount: number;
};

/** Sort ascending and drop nonsensical tiers. */
function normalize(tiers: SpendTier[]): SpendTier[] {
  return [...tiers]
    .filter((t) => t.minSubtotal > 0 && t.discountAmount > 0)
    .sort((a, b) => a.minSubtotal - b.minSubtotal);
}

/** Discount for the highest tier the subtotal qualifies for (0 if none). */
export function computeSpendDiscount(subtotal: number, tiers: SpendTier[]): number {
  let discount = 0;
  for (const t of normalize(tiers)) {
    if (subtotal >= t.minSubtotal) discount = t.discountAmount;
    else break;
  }
  return discount;
}

/**
 * Best-single-wins: the larger of the coupon vs the spend-tier discount (ties go
 * to the automatic tier, which keeps the coupon usable later). Mirrors the
 * authoritative server logic in `ordersService.createFromCart` so client-side
 * totals match what the order will actually charge.
 */
export function bestDiscount(
  couponDiscount: number,
  spendDiscount: number,
): { amount: number; source: 'spend' | 'coupon' | 'none' } {
  if (spendDiscount >= couponDiscount && spendDiscount > 0)
    return { amount: spendDiscount, source: 'spend' };
  if (couponDiscount > 0) return { amount: couponDiscount, source: 'coupon' };
  return { amount: 0, source: 'none' };
}

/** Full progress snapshot for the rewards nudge. */
export function spendTierProgress(subtotal: number, tiers: SpendTier[]): SpendTierProgress {
  const sorted = normalize(tiers);
  let current: SpendTier | null = null;
  let next: (SpendTier & { amountToNext: number }) | null = null;

  for (const t of sorted) {
    if (subtotal >= t.minSubtotal) {
      current = t;
    } else {
      next = { ...t, amountToNext: Math.max(0, t.minSubtotal - subtotal) };
      break;
    }
  }

  return { current, next, discount: current?.discountAmount ?? 0 };
}
