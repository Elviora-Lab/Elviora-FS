'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { bookWithPostEx, refreshPostExTracking } from '@/server/actions/admin/orders.actions';

type Shipment = { courierName: string; trackingNumber: string | null } | null;

export function CourierCard({
  orderId,
  shipment,
  configured,
}: {
  orderId: string;
  shipment: Shipment;
  configured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function book() {
    start(async () => {
      const res = await bookWithPostEx({ orderId });
      if (res.success) {
        toast.success(`Booked with PostEx — CN ${res.data.trackingNumber}`);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  function refresh() {
    const tn = shipment?.trackingNumber;
    if (!tn) return;
    start(async () => {
      const res = await refreshPostExTracking({ trackingNumber: tn });
      if (res.success) {
        setStatus(res.data.status);
        toast.success(res.data.status);
      } else {
        toast.error(res.message);
      }
    });
  }

  if (shipment?.trackingNumber) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Courier:</span> {shipment.courierName}
        </div>
        <div>
          <span className="text-muted-foreground">Tracking #:</span>{' '}
          <span className="font-mono">{shipment.trackingNumber}</span>
        </div>
        {status ? <div className="text-xs text-muted-foreground">Latest: {status}</div> : null}
        <Button size="sm" variant="outline" loading={pending} onClick={refresh}>
          Refresh status
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!configured ? (
        <p className="text-xs text-muted-foreground">
          Set <code className="rounded bg-muted px-1">POSTEX_API_TOKEN</code> to enable courier
          booking.
        </p>
      ) : null}
      <Button loading={pending} disabled={!configured} onClick={book}>
        Book with PostEx
      </Button>
    </div>
  );
}
