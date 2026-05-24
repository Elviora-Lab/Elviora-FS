import Link from 'next/link';

import { accountNav } from '@/config/navigation';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside>
          <h2 className="eyebrow mb-4">Account</h2>
          <nav className="flex flex-col gap-1">
            {accountNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
