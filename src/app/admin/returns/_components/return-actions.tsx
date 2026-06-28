'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { setReturnStatus } from '@/server/actions/admin/returns.actions';

type Status = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

export function ReturnActions({ id, status }: { id: string; status: Status }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();

  if (status === 'REFUNDED' || status === 'REJECTED') {
    return <span className="text-xs text-muted-foreground">No further action</span>;
  }

  function run(next: 'APPROVED' | 'REJECTED' | 'REFUNDED') {
    start(async () => {
      const res = await setReturnStatus({ id, status: next, adminNote: note || undefined });
      if (res.success) {
        toast.success(`Return ${next.toLowerCase()}`);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Internal note (optional)"
        className="h-9 text-xs"
      />
      <div className="flex flex-wrap gap-2">
        {status === 'REQUESTED' ? (
          <Button size="sm" loading={pending} onClick={() => run('APPROVED')}>
            Approve
          </Button>
        ) : null}
        {status === 'APPROVED' ? (
          <Button size="sm" loading={pending} onClick={() => run('REFUNDED')}>
            Mark refunded
          </Button>
        ) : null}
        <Button size="sm" variant="outline" loading={pending} onClick={() => run('REJECTED')}>
          Reject
        </Button>
      </div>
    </div>
  );
}
