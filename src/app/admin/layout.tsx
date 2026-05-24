import Link from 'next/link';

import { adminNav } from '@/config/navigation';
import { siteConfig } from '@/config/site';

import { cn } from '@/lib/cn';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-muted/30 lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-2 border-r border-border bg-card p-6 lg:flex">
        <Link
          href="/admin"
          className="mb-4 font-serif text-xl font-light uppercase tracking-[0.18em]"
        >
          {siteConfig.name} <span className="text-xs text-muted-foreground">/ admin</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="mt-auto text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          ← Back to store
        </Link>
      </aside>
      <main className="px-6 py-10 lg:px-10">{children}</main>
    </div>
  );
}
