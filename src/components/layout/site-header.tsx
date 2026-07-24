'use client';

import Link from 'next/link';
import { Menu, Search } from 'lucide-react';

import { siteConfig } from '@/config/site';

import { useAppDispatch } from '@/store/hooks';
import { openMobileNav, openSearch } from '@/store/slices/ui-slice';

import { cn } from '@/lib/cn';

import { BrandLockup, BrandLogo } from '@/components/brand/brand-logo';
import { CategoryBar } from '@/components/layout/category-bar';
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

        <Link
          href="/"
          aria-label={`${siteConfig.name} home`}
          className="inline-flex items-center lg:mr-2"
        >
          {/* Mark only on mobile (save space next to the icon row);
              full mark + wordmark on lg+ where there's room. */}
          <span className="lg:hidden">
            <BrandLogo variant="mark" size={36} priority />
          </span>
          <span className="hidden lg:inline">
            <BrandLockup size={36} priority />
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => dispatch(openSearch())}
          >
            <Search className="size-5" />
          </Button>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <CartDrawerTrigger />
        </div>
      </div>

      {/* Persistent category rail — every destination visible, no dropdown. */}
      <CategoryBar />
    </header>
  );
}
