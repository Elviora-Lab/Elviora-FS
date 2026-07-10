import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { ExitIntentNudge } from '@/components/layout/exit-intent-nudge';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

import { AuthHydrator } from '@/features/auth/components/auth-hydrator';
import { CartDrawer } from '@/features/cart/components/cart-drawer';
import { CartHydrator } from '@/features/cart/components/cart-hydrator';
import { WishlistHydrator } from '@/features/wishlist/components/wishlist-hydrator';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Strip + header share one sticky stack, so the strip stays pinned too. */}
      <div className="sticky top-0 z-40">
        <AnnouncementBar />
        <SiteHeader className="static" />
      </div>
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <MobileNav />
      <ExitIntentNudge />
      {/* Hydrators sync Redux with the server session/cart/wishlist on mount + invalidation. */}
      <AuthHydrator />
      <CartHydrator />
      <WishlistHydrator />
    </>
  );
}
