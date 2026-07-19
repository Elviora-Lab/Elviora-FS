import Link from 'next/link';

import { siteConfig } from '@/config/site';

import { BrandLogo } from '@/components/brand/brand-logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden bg-brand-slate lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 p-12 text-brand-cloud">
          <Link href="/" aria-label={`${siteConfig.name} home`}>
            <BrandLogo variant="mark" size={220} priority />
          </Link>
          <blockquote className="max-w-md text-center font-serif text-2xl font-light leading-snug text-brand-cloud/85">
            “Refinement is the discipline of removing — until only what matters remains.”
          </blockquote>
        </div>
      </aside>
      <main className="flex flex-col justify-center px-6 py-16 lg:px-16">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
