'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { updateOrderStatus } from '@/server/actions/admin/orders.actions';

const STATUS_VALUES = Object.values(OrderStatus);

export function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [next, setNext] = useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState('');

  function save() {
    if (next === currentStatus && !note) {
      toast.info('No change to save');
      return;
    }
    start(async () => {
      const result = await updateOrderStatus({ orderId, status: next, note: note || undefined });
      if (result.success) {
        toast.success(`Status set to ${next}`);
        setNote('');
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Status</Label>
        <select
          value={next}
          onChange={(e) => setNext(e.target.value as OrderStatus)}
          className="h-11 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Internal note (optional)</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button onClick={save} loading={pending}>
        Save status
      </Button>
    </div>
  );
}
