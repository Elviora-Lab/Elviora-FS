'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { markPaymentReceived } from '@/server/actions/admin/orders.actions';

/**
 * Settle a payment collected outside the gateway — cash on delivery or bank
 * transfer. Hidden once the order is paid or refunded.
 */
export function PaymentActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function markPaid() {
    if (!confirm('Mark this order as paid? Use this once COD/bank payment is in hand.')) return;
    start(async () => {
      const result = await markPaymentReceived({ orderId });
      if (result.success) {
        toast.success('Payment marked as received');
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button size="sm" variant="outline" loading={pending} onClick={markPaid}>
      Mark payment received
    </Button>
  );
}
