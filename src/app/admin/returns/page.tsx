import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate, formatMoney } from '@/utils/format';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { ReturnActions } from './_components/return-actions';

import { returnsRepo } from '@/server/repositories/returns.repo';

export const metadata = buildMetadata({ title: 'Admin · Returns', noIndex: true });
export const dynamic = 'force-dynamic';

const STATUS_VARIANT: Record<string, 'muted' | 'success' | 'gold' | 'danger'> = {
  REQUESTED: 'gold',
  APPROVED: 'gold',
  REFUNDED: 'success',
  REJECTED: 'danger',
};

export default async function AdminReturnsPage() {
  const returns = await returnsRepo.listForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">Returns</h1>
        <p className="text-sm text-muted-foreground">
          Review and resolve customer return &amp; refund requests.
        </p>
      </header>

      {returns.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No return requests yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Requested</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 align-top">
                    <td className="p-3 font-mono text-xs">{r.order.orderNumber}</td>
                    <td className="p-3">
                      <div>
                        {[r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">{r.user.email}</div>
                    </td>
                    <td className="p-3">
                      <div>{r.reason}</div>
                      {r.comment ? (
                        <div className="text-xs text-muted-foreground">{r.comment}</div>
                      ) : null}
                    </td>
                    <td className="p-3 tabular-nums">
                      {formatMoney(Number(r.order.totalAmount), r.order.currency)}
                    </td>
                    <td className="p-3">
                      <Badge variant={STATUS_VARIANT[r.status] ?? 'muted'}>{r.status}</Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {formatDate(r.createdAt, { dateStyle: 'medium' })}
                    </td>
                    <td className="p-3">
                      <ReturnActions id={r.id} status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
