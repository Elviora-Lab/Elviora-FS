import Link from 'next/link';

import { footerNav } from '@/config/navigation';
import { siteConfig } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-gradient-pearl">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex max-w-md flex-col gap-4 lg:col-span-2">
            <span className="font-serif text-3xl font-light uppercase tracking-[0.2em]">
              {siteConfig.name}
            </span>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
            <form className="mt-2 flex gap-2" action="/api/newsletter" method="post">
              <input
                type="email"
                name="email"
                required
                placeholder="Your email"
                className="h-11 flex-1 rounded-md border border-border bg-transparent px-3.5 text-sm placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 rounded-md bg-foreground px-5 text-xs uppercase tracking-[0.14em] text-background hover:opacity-90"
              >
                Subscribe
              </button>
            </form>
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
          <p>Crafted with care in Paris &middot; New York &middot; Tokyo.</p>
        </div>
      </div>
    </footer>
  );
}
