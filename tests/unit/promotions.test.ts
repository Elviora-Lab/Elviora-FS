import { describe, expect, it } from 'vitest';

import { bestDiscount, computeSpendDiscount, spendTierProgress } from '@/lib/promotions';

// Elviora's seeded Spend & Save ladder.
const TIERS = [
  { minSubtotal: 1000, discountAmount: 50 },
  { minSubtotal: 1500, discountAmount: 100 },
  { minSubtotal: 2000, discountAmount: 175 },
  { minSubtotal: 2500, discountAmount: 250 },
];

describe('computeSpendDiscount', () => {
  it('is 0 below the first threshold', () => {
    expect(computeSpendDiscount(0, TIERS)).toBe(0);
    expect(computeSpendDiscount(999, TIERS)).toBe(0);
  });

  it('applies a tier exactly at its threshold', () => {
    expect(computeSpendDiscount(1000, TIERS)).toBe(50);
    expect(computeSpendDiscount(2500, TIERS)).toBe(250);
  });

  it('applies the highest qualifying tier between thresholds', () => {
    expect(computeSpendDiscount(1499, TIERS)).toBe(50);
    expect(computeSpendDiscount(1500, TIERS)).toBe(100);
    expect(computeSpendDiscount(2200, TIERS)).toBe(175);
    expect(computeSpendDiscount(9999, TIERS)).toBe(250); // caps at the top tier
  });

  it('handles unsorted tiers and ignores junk', () => {
    const messy = [
      { minSubtotal: 2000, discountAmount: 175 },
      { minSubtotal: 1000, discountAmount: 50 },
      { minSubtotal: -5, discountAmount: 10 }, // invalid
      { minSubtotal: 1500, discountAmount: 0 }, // invalid (no discount)
    ];
    expect(computeSpendDiscount(1600, messy)).toBe(50);
    expect(computeSpendDiscount(2000, messy)).toBe(175);
  });

  it('returns 0 when there are no tiers', () => {
    expect(computeSpendDiscount(5000, [])).toBe(0);
  });
});

describe('spendTierProgress', () => {
  it('points at the first tier when the cart is empty-ish', () => {
    const p = spendTierProgress(600, TIERS);
    expect(p.current).toBeNull();
    expect(p.discount).toBe(0);
    expect(p.next).toMatchObject({ minSubtotal: 1000, discountAmount: 50, amountToNext: 400 });
  });

  it('reports the unlocked tier and the next one to chase', () => {
    const p = spendTierProgress(1500, TIERS);
    expect(p.current).toMatchObject({ minSubtotal: 1500, discountAmount: 100 });
    expect(p.discount).toBe(100);
    expect(p.next).toMatchObject({ minSubtotal: 2000, amountToNext: 500 });
  });

  it('has no next tier at the top of the ladder', () => {
    const p = spendTierProgress(3000, TIERS);
    expect(p.current).toMatchObject({ minSubtotal: 2500, discountAmount: 250 });
    expect(p.next).toBeNull();
  });
});

describe('bestDiscount (best-single-wins)', () => {
  it('applies the coupon when it beats the tier', () => {
    expect(bestDiscount(200, 100)).toEqual({ amount: 200, source: 'coupon' });
  });

  it('applies the tier when it beats the coupon', () => {
    expect(bestDiscount(50, 175)).toEqual({ amount: 175, source: 'spend' });
  });

  it('gives ties to the automatic tier (keeps the coupon usable)', () => {
    expect(bestDiscount(100, 100)).toEqual({ amount: 100, source: 'spend' });
  });

  it('falls back to coupon-only or none', () => {
    expect(bestDiscount(80, 0)).toEqual({ amount: 80, source: 'coupon' });
    expect(bestDiscount(0, 0)).toEqual({ amount: 0, source: 'none' });
  });
});
