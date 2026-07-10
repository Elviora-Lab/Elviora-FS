'use client';

import { computeSpendDiscount, type SpendTier } from '@/lib/promotions';

import { useGetSpendTiersQuery } from '../api/promotions-api';

/**
 * Client-side Spend & Save state for a given subtotal — the active tiers plus
 * the discount they yield. For DISPLAY only; the order-time discount is always
 * recomputed authoritatively on the server.
 */
export function useSpendDiscount(subtotal: number): { tiers: SpendTier[]; spendDiscount: number } {
  const { data } = useGetSpendTiersQuery();
  const tiers = data?.tiers ?? [];
  return { tiers, spendDiscount: computeSpendDiscount(subtotal, tiers) };
}
