'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { mainNav } from '@/config/navigation';
import { siteConfig } from '@/config/site';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeMobileNav } from '@/store/slices/ui-slice';

import { BrandLogo } from '@/components/brand/brand-logo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

/**
 * Mobile navigation drawer.
 *
 * Triggered by the hamburger button in `SiteHeader` (which dispatches
 * `openMobileNav`). Listens to `ui.mobileNavOpen` and renders the sheet
 * accordingly. Closes itself:
 *  - when the user taps a nav link
 *  - on route change (defence in depth)
 *  - via the standard Sheet close behaviour (overlay tap / Esc / X)
 *
 * Items with `children` collapse into an Accordion so the parent stays
 * tappable. Children that have their own `children` (category →
 * subcategories) nest a second Accordion, keeping every level a full-width
 * tap target.
 */
export function MobileNav() {
  const open = useAppSelector((s) => s.ui.mobileNavOpen);
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();

  // Close on navigation — `usePathname` updates after the route commits.
  useEffect(() => {
    if (open) dispatch(closeMobileNav());
    // We intentionally only want this to fire on pathname change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const close = () => dispatch(closeMobileNav());

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? null : close())}>
      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle asChild>
            <Link href="/" onClick={close} aria-label={`${siteConfig.name} home`}>
              <BrandLogo variant="wordmark" size={18} />
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
        </SheetHeader>

        {/* Quick actions */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 justify-start"
            onClick={() => {
              close();
              router.push('/search');
            }}
          >
            <Search className="size-4" /> Search products
          </Button>
        </div>

        {/* Primary navigation */}
        <nav className="px-2 py-2">
          <Accordion type="multiple" className="flex flex-col">
            {mainNav.map((item) => {
              if (item.comingSoon) {
                return (
                  <div
                    key={item.href}
                    aria-disabled="true"
                    className="flex items-center justify-between rounded-md px-3 py-3 text-base font-light tracking-wide text-foreground/40"
                  >
                    <span>{item.label}</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Coming soon
                    </span>
                  </div>
                );
              }
              if (!item.children?.length) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="rounded-md px-3 py-3 text-base font-light tracking-wide text-foreground hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <AccordionItem key={item.href} value={item.href} className="border-b-0">
                  <AccordionTrigger className="rounded-md px-3 py-3 text-base font-light tracking-wide hover:bg-muted hover:no-underline">
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pl-3">
                    <Accordion type="multiple" className="flex flex-col">
                      {item.children.map((child) =>
                        child.children?.length ? (
                          <AccordionItem key={child.href} value={child.href} className="border-b-0">
                            <AccordionTrigger className="rounded-md px-3 py-2.5 font-sans text-sm font-normal tracking-wide text-foreground hover:bg-muted hover:no-underline">
                              {child.label}
                            </AccordionTrigger>
                            <AccordionContent className="pb-1 pl-3">
                              <ul className="flex flex-col border-l border-border pl-1">
                                {child.children.map((sub) => (
                                  <li key={sub.href}>
                                    <Link
                                      href={sub.href}
                                      onClick={close}
                                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                      {sub.label}
                                    </Link>
                                  </li>
                                ))}
                                <li>
                                  <Link
                                    href={child.href}
                                    onClick={close}
                                    className="block rounded-md px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted hover:text-foreground"
                                  >
                                    Shop all {child.label} →
                                  </Link>
                                </li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        ) : (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={close}
                            className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {child.label}
                          </Link>
                        ),
                      )}
                      <Link
                        href={item.href}
                        onClick={close}
                        className="block rounded-md px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Shop all {item.label} →
                      </Link>
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-border px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {siteConfig.tagline}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
