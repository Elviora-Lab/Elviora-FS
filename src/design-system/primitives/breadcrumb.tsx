import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';

type Crumb = { label: string; href?: string };

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-xs text-muted-foreground', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="uppercase tracking-[0.12em] transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="uppercase tracking-[0.12em] text-foreground" aria-current="page">
                  {item.label}
                </span>
              )}
              {!last ? <ChevronRight className="size-3" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
