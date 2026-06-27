import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate, formatMoney } from '@/utils/format';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { adminDashboardRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Dashboard', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [kpis, recentOrders] = await Promise.all([
    adminDashboardRepo.kpis(),
    adminDashboardRepo.recentOrders(8),
  ]);

  const tiles: Array<{ label: string; value: string; accent: boolean; href?: string }> = [
    { label: 'Revenue · today', value: formatMoney(kpis.revenueToday), accent: false },
    { label: 'Revenue · this week', value: formatMoney(kpis.revenueWeek), accent: false },
    { label: 'Lifetime revenue', value: formatMoney(kpis.revenue), accent: false },
    { label: 'Orders (30d)', value: String(kpis.ordersLast30), accent: false },
    { label: 'Active products', value: String(kpis.productsCount), accent: false },
    { label: 'Customers', value: String(kpis.usersCount), accent: false },
    {
      label: 'Pending reviews',
      value: String(kpis.pendingReviews),
      accent: kpis.pendingReviews > 0,
      href: '/admin/reviews',
    },
    {
      label: 'Low-stock variants (< 10)',
      value: String(kpis.lowStockVariants),
      accent: kpis.lowStockVariants > 0,
      href: '/admin/products',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="editorial-heading text-display-md">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An at-a-glance view of the house.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((k) => {
          const card = (
            <Card className={k.accent ? 'border-brand-gold/40' : ''}>
              <CardHeader>
                <CardDescription>{k.label}</CardDescription>
                <CardTitle className="text-3xl">{k.value}</CardTitle>
              </CardHeader>
            </Card>
          );
          return k.href ? (
            <Link key={k.label} href={k.href} className="block transition-shadow hover:shadow-card">
              {card}
            </Link>
          ) : (
            <div key={k.label}>{card}</div>
          );
        })}
      </div>

      <section>
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-light">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </header>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Placed</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border/60 last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{o.user?.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="muted">{o.orderStatus}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {formatMoney(Number(o.totalAmount), o.currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(o.createdAt, { dateStyle: 'medium' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
