import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark' | 'system';

type UiState = {
  theme: Theme;
  cartOpen: boolean;
  searchOpen: boolean;
  mobileNavOpen: boolean;
  toast: { id: number; message: string; variant: 'default' | 'success' | 'error' } | null;
};

const initialState: UiState = {
  theme: 'system',
  cartOpen: false,
  searchOpen: false,
  mobileNavOpen: false,
  toast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (s, a: PayloadAction<Theme>) => {
      s.theme = a.payload;
    },
    openCart: (s) => {
      s.cartOpen = true;
    },
    closeCart: (s) => {
      s.cartOpen = false;
    },
    toggleCart: (s) => {
      s.cartOpen = !s.cartOpen;
    },
    openSearch: (s) => {
      s.searchOpen = true;
    },
    closeSearch: (s) => {
      s.searchOpen = false;
    },
    openMobileNav: (s) => {
      s.mobileNavOpen = true;
    },
    closeMobileNav: (s) => {
      s.mobileNavOpen = false;
    },
    pushToast: (s, a: PayloadAction<Omit<NonNullable<UiState['toast']>, 'id'>>) => {
      s.toast = { id: Date.now(), ...a.payload };
    },
    clearToast: (s) => {
      s.toast = null;
    },
  },
});

export const {
  setTheme,
  openCart,
  closeCart,
  toggleCart,
  openSearch,
  closeSearch,
  openMobileNav,
  closeMobileNav,
  pushToast,
  clearToast,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;
