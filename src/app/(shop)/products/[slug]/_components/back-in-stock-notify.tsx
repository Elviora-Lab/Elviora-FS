'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { analytics } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { requestStockNotification } from '@/server/actions/stock-notify.actions';

export function BackInStockNotify({ variantId }: { variantId: string }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <p className="rounded-md border border-border p-3 text-xs text-muted-foreground">
        Great — we&apos;ll email you the moment it&apos;s back in stock.
      </p>
    );
  }

  function submit() {
    if (!email.trim()) {
      toast.error('Enter your email');
      return;
    }
    start(async () => {
      const res = await requestStockNotification({ variantId, email: email.trim() });
      if (res.success) {
        analytics.backInStockNotify(variantId);
        setDone(true);
        toast.success("We'll let you know when it's back");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <p className="text-sm font-medium">Out of stock — get notified when it returns.</p>
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="h-10"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button type="button" variant="outline" loading={pending} onClick={submit}>
          Notify me
        </Button>
      </div>
    </div>
  );
}
