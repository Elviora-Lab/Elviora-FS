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

export function useCart() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const count = useAppSelector(selectCartCount);
  const subtotal = useAppSelector(selectCartSubtotal);

  return {
    cart,
    count,
    subtotal,
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
    applyCoupon: useCallback((code: string) => dispatch(applyCoupon(code)), [dispatch]),
    removeCoupon: useCallback(() => dispatch(removeCoupon()), [dispatch]),
  };
}
