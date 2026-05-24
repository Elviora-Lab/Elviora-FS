'use client';

import Link from 'next/link';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { EmptyState } from '@/design-system/primitives/empty-state';
import { Button } from '@/components/ui/button';

import { wishlistActions } from '@/features/wishlist/wishlist-slice';

export function WishlistClient() {
  const ids = useAppSelector((s) => s.wishlist.productIds);
  const dispatch = useAppDispatch();

  if (ids.length === 0) {
    return (
      <EmptyState
        title="Nothing saved yet"
        description="Tap the heart on any product to keep it here."
        action={
          <Button asChild>
            <Link href="/products">Browse the edit</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {ids.map((id) => (
        <li key={id} className="flex items-center justify-between py-4">
          <span className="font-mono text-xs text-muted-foreground">{id}</span>
          <button
            type="button"
            onClick={() => dispatch(wishlistActions.remove(id))}
            className="text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
