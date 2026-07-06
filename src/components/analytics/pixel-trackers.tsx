'use client';

import { useEffect, useRef } from 'react';

import { analytics } from '@/lib/analytics';

/** Anchor that fires the Contact event when clicked (e.g. a mailto). */
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
    <a href={href} className={className} onClick={() => analytics.contact()}>
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
    analytics.skincareAssistant();
  }, []);
  return null;
}

/** Fires ViewCategory once when a category page mounts. */
export function CategoryViewTracker({ slug, name }: { slug: string; name: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    analytics.viewCategory({ slug, name });
  }, [slug, name]);
  return null;
}
