import Link from 'next/link';

import { siteConfig } from '@/config/site';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden bg-gradient-pearl lg:block">
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link href="/" className="font-serif text-2xl font-light uppercase tracking-[0.2em]">
            {siteConfig.name}
          </Link>
          <blockquote className="max-w-md font-serif text-3xl font-light leading-snug">
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
