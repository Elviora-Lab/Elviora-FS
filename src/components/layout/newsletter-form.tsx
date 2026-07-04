'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { metaPixel } from '@/lib/analytics/meta-pixel';

import { subscribeNewsletter } from '@/server/actions/newsletter.actions';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await subscribeNewsletter({ email: email.trim() });
      if (res.success) {
        metaPixel.subscribe();
        toast.success("You're on the list.");
        setEmail('');
      } else {
        toast.error(res.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex gap-2">
      <input
        type="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="h-11 flex-1 rounded-md border border-border bg-background/60 px-3.5 text-sm placeholder:text-muted-foreground focus-visible:border-foreground/50 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-md bg-foreground px-5 text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
      >
        {loading ? '…' : 'Subscribe'}
      </button>
    </form>
  );
}
