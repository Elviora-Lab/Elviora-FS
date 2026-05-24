import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-6 py-20">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="eyebrow">404</span>
        <h1 className="editorial-heading text-display-lg">This page is out of stock.</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for has moved or no longer exists.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
