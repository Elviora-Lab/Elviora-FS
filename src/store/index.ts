import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { baseApi } from '@/services/api';

import { authReducer } from '@/features/auth/store/auth-slice';
import { cartReducer } from '@/features/cart/store/cart-slice';
import { wishlistReducer } from '@/features/wishlist/wishlist-slice';

import { rtkErrorLogger } from './middleware/rtk-error-logger';
import { uiReducer } from './slices/ui-slice';

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  ui: uiReducer,
  auth: authReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
});

export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefault) =>
      getDefault({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }).concat(baseApi.middleware, rtkErrorLogger),
    devTools: process.env.NODE_ENV !== 'production',
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];
