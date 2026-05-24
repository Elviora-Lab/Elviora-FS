import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type WishlistState = {
  productIds: string[];
};

const initialState: WishlistState = { productIds: [] };

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggle: (s, a: PayloadAction<string>) => {
      const i = s.productIds.indexOf(a.payload);
      if (i === -1) s.productIds.push(a.payload);
      else s.productIds.splice(i, 1);
    },
    add: (s, a: PayloadAction<string>) => {
      if (!s.productIds.includes(a.payload)) s.productIds.push(a.payload);
    },
    remove: (s, a: PayloadAction<string>) => {
      s.productIds = s.productIds.filter((id) => id !== a.payload);
    },
    clear: (s) => {
      s.productIds = [];
    },
    hydrate: (_, a: PayloadAction<WishlistState>) => a.payload,
  },
});

export const wishlistActions = wishlistSlice.actions;
export const wishlistReducer = wishlistSlice.reducer;
