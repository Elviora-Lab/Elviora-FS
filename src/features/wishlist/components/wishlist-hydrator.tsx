'use client';

import { useEffect } from 'react';

import { useAppDispatch } from '@/store/hooks';

import { useGetWishlistIdsQuery } from '../wishlist-api';
import { wishlistActions } from '../wishlist-slice';

/**
 * Syncs Redux wishlist with the user's server-side wishlist on mount and
 * whenever the `Wishlist` RTK Query tag is invalidated (after a toggle).
 *
 * Without this, the heart icons across the storefront would only reflect
 * in-memory state — wiped on every reload, never matching the DB.
 *
 * Returns null if the user is signed out (the query 401s silently — Redux
 * stays at its initial empty state, which is correct for guests).
 */
export function WishlistHydrator() {
  const dispatch = useAppDispatch();
  const { data } = useGetWishlistIdsQuery();

  useEffect(() => {
    if (!data) return;
    dispatch(wishlistActions.hydrate({ productIds: data.productIds }));
  }, [data, dispatch]);

  return null;
}
