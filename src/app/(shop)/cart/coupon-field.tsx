'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { analytics } from '@/lib/analytics';
import { formatMoney } from '@/utils/format';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  applyCoupon as applyCouponLocal,
  removeCoupon as removeCouponLocal,
  selectCart,
  selectCartSubtotal,
} from '@/features/cart/store/cart-slice';

import { applyCoupon as validateCoupon } from '@/server/actions/cart.actions';

export function CouponField() {
  const dispatch = useAppDispatch();
  const { couponCode, couponDiscount } = useAppSelector(selectCart);
  const subtotal = useAppSelector(selectCartSubtotal);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep the discount accurate when the cart changes after a coupon is applied
  // (e.g. a percentage coupon, or the order drops below the minimum). Server is
  // the source of truth — it recomputes against the live cart subtotal.
  useEffect(() => {
    if (!couponCode) return;
    let cancelled = false;
    (async () => {
      const res = await validateCoupon({ code: couponCode });
      if (cancelled) return;
      if (res.success) {
        dispatch(applyCouponLocal({ code: res.data.code, discount: res.data.discount }));
      } else {
        dispatch(removeCouponLocal());
        toast.error(`${couponCode} removed — ${res.message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await validateCoupon({ code: trimmed });
      if (res.success) {
        dispatch(applyCouponLocal({ code: res.data.code, discount: res.data.discount }));
        analytics.couponApplied(res.data.code);
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
  }

  if (couponCode) {
    return (
      <div className="flex items-center justify-between rounded-md border border-brand-ember/40 bg-brand-mist/20 px-3 py-2 text-sm">
        <span>
          <span className="font-medium">{couponCode}</span> applied
          {couponDiscount != null ? (
            <span className="text-muted-foreground"> · you save {formatMoney(couponDiscount)}</span>
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
