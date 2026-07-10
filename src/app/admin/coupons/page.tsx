import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/utils/format';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { CouponForm } from './_components/coupon-form';
import { CouponRowActions } from './_components/coupon-row-actions';
import { SpendDiscountManager } from './_components/spend-discount-manager';

import { adminCouponsRepo } from '@/server/repositories/coupons.repo';
import { promotionsService } from '@/server/services/promotions.service';

export const metadata = buildMetadata({ title: 'Admin · Coupons', noIndex: true });
export const dynamic = 'force-dynamic';

function describeValue(type: string, value: number) {
  if (type === 'PERCENTAGE') return `${value}%`;
  if (type === 'FREE_SHIPPING') return 'Free shipping';
  return `Rs ${value}`;
}

export default async function AdminCouponsPage() {
  const [coupons, rawTiers, spendEnabled] = await Promise.all([
    adminCouponsRepo.list(),
    promotionsService.allTiers(),
    promotionsService.isEnabled(),
  ]);
  const tiers = rawTiers.map((t) => ({
    id: t.id,
    minSubtotal: Number(t.minSubtotal),
    discountAmount: Number(t.discountAmount),
    isActive: t.isActive,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">Coupons &amp; discounts</h1>
        <p className="text-sm text-muted-foreground">
          Promo codes, campaign discounts, and automatic Spend &amp; Save tiers.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Spend &amp; Save (automatic tiers)</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendDiscountManager tiers={tiers} enabled={spendEnabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create a coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All coupons</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {coupons.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No coupons yet.</p>
          ) : (
            <table className="w-full min-w-[780px] text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Min order</th>
                  <th className="p-3">Used</th>
                  <th className="p-3">Expires</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="p-3 font-mono">{c.code}</td>
                    <td className="p-3">
                      {describeValue(c.discountType, Number(c.discountValue))}
                    </td>
                    <td className="p-3">
                      {c.minimumOrderAmount ? `Rs ${Number(c.minimumOrderAmount)}` : '—'}
                    </td>
                    <td className="p-3">
                      {c._count.usages}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {c.expiresAt ? formatDate(c.expiresAt, { dateStyle: 'medium' }) : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant={c.isActive ? 'success' : 'muted'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <CouponRowActions id={c.id} isActive={c.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
