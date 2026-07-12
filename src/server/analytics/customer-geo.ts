import 'server-only';

import { prisma } from '@/lib/db';

/**
 * First-party customer geography — where our *actual buyers* are, from the
 * denormalized shipping snapshot on each order (immutable, no joins).
 *
 * This is the counterpart to the Meta "Country/Region" ad breakdowns on
 * /admin/ads: Meta shows the aggregate geography of the audience our ads
 * *reached* (ad-attributed only, never per-person); this shows who actually
 * ordered. Different questions, shown side by side.
 */

export type GeoRow = { label: string; orders: number; revenue: number };

export type CustomerGeo = {
  windowDays: number;
  currency: string;
  totalOrders: number;
  /** Top cities by order count. */
  cities: GeoRow[];
  /** Top areas/regions by order count (sub-city granularity where captured). */
  areas: GeoRow[];
};

type Row = { label: string; orders: number; revenue: number };

export async function getCustomerGeo(windowDays: number): Promise<CustomerGeo> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [cities, areas, totals] = await Promise.all([
    prisma.$queryRaw<Row[]>`
      SELECT COALESCE(NULLIF(shipping_city, ''), 'Unknown') AS label,
             COUNT(*)::int AS orders,
             COALESCE(SUM(total_amount), 0)::float AS revenue
      FROM orders
      WHERE created_at >= ${since} AND shipping_city IS NOT NULL
      GROUP BY 1
      ORDER BY orders DESC
      LIMIT 12`,
    prisma.$queryRaw<Row[]>`
      SELECT COALESCE(NULLIF(shipping_area, ''), 'Unknown') AS label,
             COUNT(*)::int AS orders,
             COALESCE(SUM(total_amount), 0)::float AS revenue
      FROM orders
      WHERE created_at >= ${since} AND shipping_area IS NOT NULL AND shipping_area <> ''
      GROUP BY 1
      ORDER BY orders DESC
      LIMIT 10`,
    prisma.order.aggregate({
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
  ]);

  return {
    windowDays,
    currency: 'PKR',
    totalOrders: totals._count._all,
    cities: cities.map((r) => ({ ...r, orders: Number(r.orders), revenue: Number(r.revenue) })),
    areas: areas.map((r) => ({ ...r, orders: Number(r.orders), revenue: Number(r.revenue) })),
  };
}
