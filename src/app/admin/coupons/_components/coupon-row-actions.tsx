'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { deleteCoupon, toggleCoupon } from '@/server/actions/admin/coupons.actions';

export function CouponRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await toggleCoupon({ id, isActive: !isActive });
      if (res.success) {
        toast.success(!isActive ? 'Activated' : 'Deactivated');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  function remove() {
    if (!confirm('Delete this coupon? This cannot be undone.')) return;
    start(async () => {
      const res = await deleteCoupon({ id });
      if (res.success) {
        toast.success('Coupon deleted');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" loading={pending} onClick={toggle}>
        {isActive ? 'Deactivate' : 'Activate'}
      </Button>
      <Button size="sm" variant="ghost" loading={pending} onClick={remove}>
        Delete
      </Button>
    </div>
  );
}
