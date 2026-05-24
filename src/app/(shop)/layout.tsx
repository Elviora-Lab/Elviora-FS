import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

import { CartDrawer } from '@/features/cart/components/cart-drawer';
import { CartHydrator } from '@/features/cart/components/cart-hydrator';
import { WishlistHydrator } from '@/features/wishlist/components/wishlist-hydrator';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      {/* Hydrators sync Redux with server-side carts/wishlists on mount + invalidation. */}
      <CartHydrator />
      <WishlistHydrator />
    </>
  );
}
