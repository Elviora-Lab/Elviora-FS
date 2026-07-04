'use client';

import { useEffect, useRef } from 'react';

import { metaPixel } from '@/lib/analytics/meta-pixel';

/** Anchor that fires the Meta Pixel Contact event when clicked (e.g. a mailto). */
export function ContactLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={() => metaPixel.contact()}>
      {children}
    </a>
  );
}

/** Fires the SkincareAssistant intent event once when the page mounts. */
export function SkincareViewTracker() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    metaPixel.skincareAssistant();
  }, []);
  return null;
}

/** Fires ViewCategory once when a category page mounts. */
export function CategoryViewTracker({ slug, name }: { slug: string; name: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    metaPixel.viewCategory({ slug, name });
  }, [slug, name]);
  return null;
}
