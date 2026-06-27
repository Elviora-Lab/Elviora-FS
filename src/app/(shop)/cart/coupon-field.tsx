'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { formatMoney } from '@/utils/format';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  applyCoupon as applyCouponLocal,
  removeCoupon as removeCouponLocal,
  selectCart,
} from '@/features/cart/store/cart-slice';

import { applyCoupon as validateCoupon } from '@/server/actions/cart.actions';

export function CouponField() {
  const dispatch = useAppDispatch();
  const { couponCode } = useAppSelector(selectCart);

  const [code, setCode] = useState('');
  const [savings, setSavings] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await validateCoupon({ code: trimmed });
      if (res.success) {
        dispatch(applyCouponLocal(res.data.code));
        setSavings(res.data.discount);
        toast.success(`Coupon ${res.data.code} applied`);
        setCode('');
      } else {
        toast.error(res.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function remove() {
    dispatch(removeCouponLocal());
    setSavings(null);
  }

  if (couponCode) {
    return (
      <div className="flex items-center justify-between rounded-md border border-brand-rosegold/40 bg-brand-blush/20 px-3 py-2 text-sm">
        <span>
          <span className="font-medium">{couponCode}</span> applied
          {savings != null ? (
            <span className="text-muted-foreground"> · you save {formatMoney(savings)}</span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={remove}
          aria-label="Remove coupon"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="flex gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Coupon code"
        className="flex-1"
        aria-label="Coupon code"
      />
      <Button type="submit" variant="outline" loading={loading}>
        Apply
      </Button>
    </form>
  );
}
