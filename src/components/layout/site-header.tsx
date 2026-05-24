'use client';

import Link from 'next/link';
import { Heart, Menu, Search, User } from 'lucide-react';

import { mainNav } from '@/config/navigation';
import { siteConfig } from '@/config/site';

import { useAppDispatch } from '@/store/hooks';
import { openMobileNav, openSearch } from '@/store/slices/ui-slice';

import { cn } from '@/lib/cn';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { CartDrawerTrigger } from '@/features/cart/components/cart-drawer';

export function SiteHeader({ className }: { className?: string }) {
  const dispatch = useAppDispatch();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border/60',
        'surface-glass',
        className,
      )}
    >
      <div className="container flex h-16 items-center gap-4">
        <button
          type="button"
          onClick={() => dispatch(openMobileNav())}
          className="grid size-10 place-items-center rounded-full hover:bg-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <Link href="/" className="font-serif text-2xl font-light uppercase tracking-[0.2em]">
          {siteConfig.name}
        </Link>

        <nav className="ml-8 hidden items-center gap-7 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs uppercase tracking-[0.14em] text-foreground/80 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => dispatch(openSearch())}
          >
            <Search className="size-5" />
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Account">
            <Link href="/account">
              <User className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link href="/account/wishlist">
              <Heart className="size-5" />
            </Link>
          </Button>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <CartDrawerTrigger />
        </div>
      </div>
    </header>
  );
}
