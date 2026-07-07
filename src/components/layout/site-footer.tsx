import Link from 'next/link';

import { footerNav } from '@/config/navigation';
import { siteConfig } from '@/config/site';

import { BrandLockup } from '@/components/brand/brand-logo';
import { NewsletterForm } from '@/components/layout/newsletter-form';

export function SiteFooter() {
  return (
    <footer className="surface-pearl border-t border-border/60">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex max-w-md flex-col gap-4 lg:col-span-2">
            <BrandLockup size={48} />
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
            <NewsletterForm />
          </div>

          {Object.entries(footerNav).map(([heading, items]) => (
            <div key={heading} className="flex flex-col gap-3">
              <h4 className="eyebrow">{heading}</h4>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="luxe-divider my-10" />

        <div className="flex flex-col gap-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
