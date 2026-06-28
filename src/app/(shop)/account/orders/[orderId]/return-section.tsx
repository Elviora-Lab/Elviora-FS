'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { requestReturn, RETURN_REASONS } from '@/server/actions/returns.actions';

type ExistingReturn = { status: string; reason: string } | null;

const STATUS_VARIANT: Record<string, 'muted' | 'success' | 'gold' | 'danger'> = {
  REQUESTED: 'gold',
  APPROVED: 'gold',
  REFUNDED: 'success',
  REJECTED: 'danger',
};

export function ReturnSection({
  orderId,
  orderStatus,
  existing,
}: {
  orderId: string;
  orderStatus: string;
  existing: ExistingReturn;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [comment, setComment] = useState('');
  const [pending, start] = useTransition();

  if (existing) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Return</span>
          <Badge variant={STATUS_VARIANT[existing.status] ?? 'muted'}>{existing.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Reason: {existing.reason}</p>
      </div>
    );
  }

  if (orderStatus !== 'DELIVERED') {
    return (
      <p className="text-xs text-muted-foreground">
        You can request a return once your order is delivered.
      </p>
    );
  }

  function submit() {
    start(async () => {
      const res = await requestReturn({
        orderId,
        reason: reason as (typeof RETURN_REASONS)[number],
        comment: comment || undefined,
      });
      if (res.success) {
        toast.success('Return request submitted');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Request a return
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Reason</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {RETURN_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Anything we should know? (optional)"
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <div className="flex gap-2">
        <Button size="sm" loading={pending} onClick={submit}>
          Submit request
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
