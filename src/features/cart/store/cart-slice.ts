import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';

export type CartLine = {
  /** Server-side cart_items.id — present when the line came from the DB.
   *  Optimistically-added lines (before server confirmation) won't have one. */
  id?: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  currency: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  couponCode: string | null;
  shippingMethodId: string | null;
};

const initialState: CartState = {
  lines: [],
  couponCode: null,
  shippingMethodId: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addLine: (s, a: PayloadAction<CartLine>) => {
      const existing = s.lines.find(
        (l) => l.productId === a.payload.productId && l.variantId === a.payload.variantId,
      );
      if (existing) {
        existing.quantity += a.payload.quantity;
      } else {
        s.lines.push(a.payload);
      }
    },
    updateQuantity: (
      s,
      a: PayloadAction<{ productId: string; variantId: string; quantity: number }>,
    ) => {
      const line = s.lines.find(
        (l) => l.productId === a.payload.productId && l.variantId === a.payload.variantId,
      );
      if (!line) return;
      if (a.payload.quantity <= 0) {
        s.lines = s.lines.filter((l) => l !== line);
      } else {
        line.quantity = a.payload.quantity;
      }
    },
    removeLine: (s, a: PayloadAction<{ productId: string; variantId: string }>) => {
      s.lines = s.lines.filter(
        (l) => !(l.productId === a.payload.productId && l.variantId === a.payload.variantId),
      );
    },
    clearCart: (s) => {
      s.lines = [];
      s.couponCode = null;
    },
    applyCoupon: (s, a: PayloadAction<string>) => {
      s.couponCode = a.payload;
    },
    removeCoupon: (s) => {
      s.couponCode = null;
    },
    setShippingMethod: (s, a: PayloadAction<string | null>) => {
      s.shippingMethodId = a.payload;
    },
    hydrate: (_, a: PayloadAction<CartState>) => a.payload,
  },
});

export const {
  addLine,
  updateQuantity,
  removeLine,
  clearCart,
  applyCoupon,
  removeCoupon,
  setShippingMethod,
  hydrate,
} = cartSlice.actions;

export const cartReducer = cartSlice.reducer;

// — Selectors —
export const selectCart = (s: RootState) => s.cart;
export const selectCartLines = (s: RootState) => s.cart.lines;
export const selectCartCount = createSelector(selectCartLines, (lines) =>
  lines.reduce((n, l) => n + l.quantity, 0),
);
export const selectCartSubtotal = createSelector(selectCartLines, (lines) =>
  lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
);
