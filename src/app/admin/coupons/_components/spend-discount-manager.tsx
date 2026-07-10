'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  createSpendTier,
  deleteSpendTier,
  setSpendDiscountEnabled,
  toggleSpendTier,
} from '@/server/actions/admin/spend-discount.actions';

export type AdminTier = {
  id: string;
  minSubtotal: number;
  discountAmount: number;
  isActive: boolean;
};

export function SpendDiscountManager({ tiers, enabled }: { tiers: AdminTier[]; enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [min, setMin] = useState('');
  const [amount, setAmount] = useState('');

  const run = (fn: () => Promise<{ success: boolean; message?: string }>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(ok);
        router.refresh();
      } else {
        toast.error(res.message ?? 'Something went wrong');
      }
    });

  function add() {
    const minN = Number(min);
    const amtN = Number(amount);
    if (!minN || !amtN) {
      toast.error('Enter a spend threshold and a discount');
      return;
    }
    if (amtN >= minN) {
      toast.error('Discount must be less than the threshold');
      return;
    }
    start(async () => {
      const res = await createSpendTier({ minSubtotal: minN, discountAmount: amtN });
      if (res.success) {
        toast.success('Tier added');
        setMin('');
        setAmount('');
        router.refresh();
      } else {
        toast.error(res.message ?? 'Something went wrong');
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Master switch */}
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
        <div>
          <div className="text-sm font-medium">Spend &amp; Save {enabled ? 'is on' : 'is off'}</div>
          <p className="text-xs text-muted-foreground">
            Automatic cart discounts. Best-single-wins vs coupons; free shipping unaffected.
          </p>
        </div>
        <Button
          size="sm"
          variant={enabled ? 'outline' : 'gold'}
          loading={pending}
          onClick={() => run(() => setSpendDiscountEnabled({ enabled: !enabled }), 'Updated')}
        >
          {enabled ? 'Turn off' : 'Turn on'}
        </Button>
      </div>

      {/* Add a tier */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Spend at least (Rs)
          <Input
            type="number"
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="1000"
            className="w-36"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Get off (Rs)
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50"
            className="w-36"
          />
        </label>
        <Button size="sm" loading={pending} onClick={add}>
          Add tier
        </Button>
      </div>

      {/* Tier list */}
      {tiers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tiers yet — add one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="p-3">Spend ≥</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Effective</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="p-3 tabular-nums">Rs {t.minSubtotal.toLocaleString('en-US')}</td>
                  <td className="p-3 tabular-nums">
                    Rs {t.discountAmount.toLocaleString('en-US')}
                  </td>
                  <td className="p-3 tabular-nums text-muted-foreground">
                    {((t.discountAmount / t.minSubtotal) * 100).toFixed(1)}%
                  </td>
                  <td className="p-3">
                    <Badge variant={t.isActive ? 'success' : 'muted'}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={pending}
                        onClick={() =>
                          run(
                            () => toggleSpendTier({ id: t.id, isActive: !t.isActive }),
                            t.isActive ? 'Deactivated' : 'Activated',
                          )
                        }
                      >
                        {t.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={pending}
                        onClick={() => {
                          if (!confirm('Delete this tier?')) return;
                          run(() => deleteSpendTier({ id: t.id }), 'Tier deleted');
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
