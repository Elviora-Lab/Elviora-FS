'use client';

import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  addLine,
  applyCoupon,
  type CartLine,
  clearCart,
  removeCoupon,
  removeLine,
  selectCart,
  selectCartCount,
  selectCartSubtotal,
  updateQuantity,
} from '@/features/cart/store/cart-slice';

/**
 * Write-only cart API. Subscribes to NOTHING — components that only mutate the
 * cart (e.g. the PDP's add-to-bag) should use this so they don't re-render on
 * every cart change.
 */
export function useCartActions() {
  const dispatch = useAppDispatch();

  return {
    add: useCallback((line: CartLine) => dispatch(addLine(line)), [dispatch]),
    updateQty: useCallback(
      (productId: string, variantId: string, quantity: number) =>
        dispatch(updateQuantity({ productId, variantId, quantity })),
      [dispatch],
    ),
    remove: useCallback(
      (productId: string, variantId: string) => dispatch(removeLine({ productId, variantId })),
      [dispatch],
    ),
    clear: useCallback(() => dispatch(clearCart()), [dispatch]),
    applyCoupon: useCallback(
      (code: string, discount = 0) => dispatch(applyCoupon({ code, discount })),
      [dispatch],
    ),
    removeCoupon: useCallback(() => dispatch(removeCoupon()), [dispatch]),
  };
}

export function useCart() {
  const cart = useAppSelector(selectCart);
  const count = useAppSelector(selectCartCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const actions = useCartActions();

  return {
    cart,
    count,
    subtotal,
    ...actions,
  };
}
