'use client';

import { useCallback, useTransition } from 'react';
import { toast } from 'sonner';

import { useAppDispatch } from '@/store/hooks';

import { wishlistApi } from './wishlist-api';
import { wishlistActions } from './wishlist-slice';

import { toggleWishlist } from '@/server/actions/wishlist.actions';

/**
 * Heart-icon toggle.
 *
 * Fires three things in order:
 *  1. Optimistic Redux dispatch → the icon flips instantly.
 *  2. `toggleWishlist` Server Action → persists to the DB.
 *  3. Invalidate the Wishlist RTK Query tag → the hydrator re-syncs Redux
 *     with the server's canonical state (no drift between tabs / refreshes).
 *
 * If the Server Action fails (unauthenticated, etc.), the optimistic update
 * is rolled back and the user sees a toast.
 */
export function useWishlistToggle() {
  const dispatch = useAppDispatch();
  const [, start] = useTransition();

  return useCallback(
    (productId: string) => {
      // 1. Optimistic flip
      dispatch(wishlistActions.toggle(productId));

      // 2 + 3. Persist + invalidate
      start(async () => {
        const result = await toggleWishlist({ productId });
        if (!result.success) {
          // Roll back.
          dispatch(wishlistActions.toggle(productId));
          toast.error(result.message || 'Sign in to save items to your wishlist');
          return;
        }
        dispatch(wishlistApi.util.invalidateTags(['Wishlist']));
      });
    },
    [dispatch],
  );
}
