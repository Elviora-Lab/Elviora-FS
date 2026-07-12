import 'server-only';

import { prisma } from '@/lib/db';

import { adminAnalyticsRepo } from '@/server/repositories/admin.repo';

/**
 * Audience Insights — turns your first-party behavioural data into (a) reachable
 * marketing segments, (b) demand signals (what people want but don't buy), and
 * (c) prioritised, rule-based recommendations for finding the audience that
 * actually converts.
 *
 * Why rules, not a black-box "AI" number: at 0–few sales, Meta's own audience
 * tools (Lookalikes, purchase-optimised delivery) have no seed data to learn
 * from — the cold-start problem. The leverage is (1) seed Custom Audiences from
 * the engagement you DO have and (2) fix the conversion leak. These functions
 * surface exactly that, from your real data, so you can act today.
 */

// ---------------------------------------------------------------------------
// Segments — reachable people you can upload to Meta as a Custom Audience.
// ---------------------------------------------------------------------------

export type SegmentKey =
  | 'purchasers'
  | 'atc_no_purchase'
  | 'wishlist'
  | 'viewers'
  | 'quiz'
  | 'subscribers';

export type Segment = {
  key: SegmentKey;
  label: string;
  description: string;
  /** Identifiable people in the segment. */
  people: number;
  /** How many carry a phone (email is always present) — richer match keys. */
  withPhone: number;
};

const SEGMENT_META: Record<SegmentKey, { label: string; description: string }> = {
  purchasers: {
    label: 'Purchasers',
    description: 'Bought at least once — your Lookalike seed once ≥100.',
  },
  atc_no_purchase: {
    label: 'Added to cart, never bought',
    description: 'Your warmest untapped audience — retarget these first.',
  },
  wishlist: {
    label: 'Wishlist owners',
    description: 'Saved a product — high intent, ready for a nudge.',
  },
  viewers: { label: 'Product viewers', description: 'Browsed a product — broad engagement pool.' },
  quiz: {
    label: 'AI skin-quiz takers',
    description: 'Told you their skin concerns — precise intent.',
  },
  subscribers: {
    label: 'Newsletter subscribers',
    description: 'Opted in — email Custom Audience.',
  },
};

type CountRow = { people: number; with_phone: number };

async function segmentCounts(): Promise<Record<SegmentKey, CountRow>> {
  const [purchasers, atc, wishlist, viewers, quiz, subs] = await Promise.all([
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT u.id)::int AS people,
             COUNT(DISTINCT u.id) FILTER (WHERE u.phone IS NOT NULL)::int AS with_phone
      FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)`,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT u.id)::int AS people,
             COUNT(DISTINCT u.id) FILTER (WHERE u.phone IS NOT NULL)::int AS with_phone
      FROM users u
      WHERE EXISTS (SELECT 1 FROM cart_event_logs c WHERE c.user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)`,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT u.id)::int AS people,
             COUNT(DISTINCT u.id) FILTER (WHERE u.phone IS NOT NULL)::int AS with_phone
      FROM users u WHERE EXISTS (SELECT 1 FROM wishlists w WHERE w.user_id = u.id)`,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT u.id)::int AS people,
             COUNT(DISTINCT u.id) FILTER (WHERE u.phone IS NOT NULL)::int AS with_phone
      FROM users u WHERE EXISTS (SELECT 1 FROM product_view_logs v WHERE v.user_id = u.id)`,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT COALESCE(a.user_id::text, lower(a.email)))::int AS people,
             COUNT(DISTINCT u.id) FILTER (WHERE u.phone IS NOT NULL)::int AS with_phone
      FROM ai_skin_assessments a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.user_id IS NOT NULL OR a.email IS NOT NULL`,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS people, 0::int AS with_phone
      FROM newsletter_subscribers WHERE is_active = true`,
  ]);
  const norm = (r: CountRow[]) => ({
    people: Number(r[0]?.people ?? 0),
    with_phone: Number(r[0]?.with_phone ?? 0),
  });
  return {
    purchasers: norm(purchasers),
    atc_no_purchase: norm(atc),
    wishlist: norm(wishlist),
    viewers: norm(viewers),
    quiz: norm(quiz),
    subscribers: norm(subs),
  };
}

/** Contacts (email + phone) for a segment — the CSV you upload to Meta. */
export async function getSegmentContacts(
  key: SegmentKey,
): Promise<Array<{ email: string; phone: string | null }>> {
  type Row = { email: string; phone: string | null };
  switch (key) {
    case 'purchasers':
      return prisma.$queryRaw<Row[]>`
        SELECT DISTINCT u.email, u.phone FROM users u
        WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)`;
    case 'atc_no_purchase':
      return prisma.$queryRaw<Row[]>`
        SELECT DISTINCT u.email, u.phone FROM users u
        WHERE EXISTS (SELECT 1 FROM cart_event_logs c WHERE c.user_id = u.id)
          AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)`;
    case 'wishlist':
      return prisma.$queryRaw<Row[]>`
        SELECT DISTINCT u.email, u.phone FROM users u
        WHERE EXISTS (SELECT 1 FROM wishlists w WHERE w.user_id = u.id)`;
    case 'viewers':
      return prisma.$queryRaw<Row[]>`
        SELECT DISTINCT u.email, u.phone FROM users u
        WHERE EXISTS (SELECT 1 FROM product_view_logs v WHERE v.user_id = u.id)`;
    case 'quiz':
      // Logged-in quiz-takers (with phone) UNION guest leads (email only).
      return prisma.$queryRaw<Row[]>`
        SELECT DISTINCT email, phone FROM (
          SELECT u.email AS email, u.phone AS phone FROM users u
            WHERE EXISTS (SELECT 1 FROM ai_skin_assessments a WHERE a.user_id = u.id)
          UNION
          SELECT lower(a.email) AS email, NULL::text AS phone FROM ai_skin_assessments a
            WHERE a.user_id IS NULL AND a.email IS NOT NULL
        ) t`;
    case 'subscribers':
      return prisma.$queryRaw<Row[]>`
        SELECT email, NULL::text AS phone FROM newsletter_subscribers WHERE is_active = true`;
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Demand — high intent, low conversion (what to promote AND what to fix).
// ---------------------------------------------------------------------------

export type DemandProduct = {
  id: string;
  name: string;
  slug: string;
  views: number;
  carts: number;
  purchases: number;
  /** Weighted intent (carts count 3× a view). */
  intent: number;
};

async function demandSignals(windowDays: number): Promise<DemandProduct[]> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const [viewed, carted, purchaseRows] = await Promise.all([
    adminAnalyticsRepo.topViewed(windowDays, 30),
    adminAnalyticsRepo.topAddedToCart(windowDays, 30),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { order: { createdAt: { gte: since } }, productId: { not: null } },
    }),
  ]);

  const map = new Map<string, DemandProduct>();
  for (const v of viewed) {
    map.set(v.id, {
      id: v.id,
      name: v.name,
      slug: v.slug,
      views: v.count,
      carts: 0,
      purchases: 0,
      intent: 0,
    });
  }
  for (const c of carted) {
    const row = map.get(c.id) ?? {
      id: c.id,
      name: c.name,
      slug: c.slug,
      views: 0,
      carts: 0,
      purchases: 0,
      intent: 0,
    };
    row.carts = c.count;
    map.set(c.id, row);
  }
  for (const p of purchaseRows) {
    if (!p.productId) continue;
    const row = map.get(p.productId);
    if (row) row.purchases = Number(p._sum.quantity ?? 0);
  }
  return [...map.values()]
    .map((r) => ({ ...r, intent: r.views + r.carts * 3 }))
    .filter((r) => r.intent > 0)
    .sort((a, b) => b.intent - a.intent)
    .slice(0, 12);
}

// ---------------------------------------------------------------------------
// Skin concerns — interest segments straight from the AI quiz.
// ---------------------------------------------------------------------------

export type ConcernRow = { label: string; count: number };

async function skinConcerns(): Promise<ConcernRow[]> {
  const rows = await prisma.aiSkinAssessment.findMany({ select: { concerns: true } });
  const tally = new Map<string, number>();
  for (const r of rows) {
    const list = Array.isArray(r.concerns) ? r.concerns : [];
    for (const raw of list) {
      const c = String(raw).trim().toLowerCase();
      if (c) tally.set(c, (tally.get(c) ?? 0) + 1);
    }
  }
  return [...tally.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Recommendations — prioritised next actions from the data above.
// ---------------------------------------------------------------------------

export type Recommendation = { priority: 'high' | 'medium'; title: string; detail: string };

function buildRecommendations(
  segments: Segment[],
  demand: DemandProduct[],
  concerns: ConcernRow[],
  totalPurchasers: number,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const seg = (k: SegmentKey) => segments.find((s) => s.key === k)?.people ?? 0;

  if (totalPurchasers < 50) {
    recs.push({
      priority: 'high',
      title: 'Optimise ads for Add-to-Cart, not Purchase',
      detail: `You have ${totalPurchasers} purchaser(s). Meta needs ~50 conversions to exit "learning", so purchase-optimised delivery has nothing to learn from. Optimise for AddToCart/ViewContent (your CAPI already sends these) until purchase volume builds.`,
    });
  }
  const atc = seg('atc_no_purchase');
  if (atc > 0) {
    recs.push({
      priority: 'high',
      title: `Retarget ${atc} add-to-cart shopper(s)`,
      detail:
        'They added to cart and didn’t buy — your warmest audience. Export below, upload as a Custom Audience, and run a retargeting + reminder-email push.',
    });
  }
  const reachable = seg('viewers') + seg('subscribers') + seg('quiz') + seg('wishlist');
  if (reachable >= 20) {
    recs.push({
      priority: 'medium',
      title: `Seed a Lookalike from ${reachable} engaged contact(s)`,
      detail:
        'Purchase-Lookalikes need ~100 buyers you don’t have yet — but an engagement Custom Audience (viewers + subscribers + quiz + wishlist) works now. Export, upload, and build a 1–3% Lookalike for cold prospecting.',
    });
  }
  const noSale = demand.filter((d) => d.purchases === 0 && d.intent >= 3).slice(0, 3);
  if (noSale.length) {
    recs.push({
      priority: 'high',
      title: `Proven demand, zero sales: ${noSale.map((d) => d.name).join(', ')}`,
      detail:
        'These get views/carts but no purchases — real interest meeting a conversion wall. Feature them in ads AND check price, stock, product page and trust signals.',
    });
  }
  if (concerns.length) {
    const top = concerns[0];
    recs.push({
      priority: 'medium',
      title: `Run concern-specific creative for "${top!.label}" (${top!.count})`,
      detail:
        'Your quiz reveals what shoppers care about. Match ad creative + landing pages to the top concern instead of generic product shots.',
    });
  }
  recs.push({
    priority: 'medium',
    title: 'Go broad and let Meta’s AI find the pocket',
    detail:
      'At low spend, hand-picked interests are too small to learn. Use Advantage+ / broad (Pakistan, women 18–45, a couple of beauty/skincare interest stacks) and let delivery optimise. Precision comes after you have conversion data.',
  });
  return recs;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export type AudienceInsights = {
  windowDays: number;
  totalPurchasers: number;
  reachableTotal: number;
  segments: Segment[];
  demand: DemandProduct[];
  concerns: ConcernRow[];
  topSearches: Array<{ keyword: string; count: number }>;
  recommendations: Recommendation[];
};

export async function getAudienceInsights(windowDays = 30): Promise<AudienceInsights> {
  const [counts, demand, concerns, topSearches] = await Promise.all([
    segmentCounts(),
    demandSignals(windowDays),
    skinConcerns(),
    adminAnalyticsRepo.topSearches(windowDays, 10),
  ]);

  const segments: Segment[] = (Object.keys(SEGMENT_META) as SegmentKey[]).map((key) => ({
    key,
    ...SEGMENT_META[key],
    people: counts[key].people,
    withPhone: counts[key].with_phone,
  }));

  const reachableTotal =
    counts.viewers.people + counts.subscribers.people + counts.quiz.people + counts.wishlist.people;

  return {
    windowDays,
    totalPurchasers: counts.purchasers.people,
    reachableTotal,
    segments,
    demand,
    concerns,
    topSearches,
    recommendations: buildRecommendations(segments, demand, concerns, counts.purchasers.people),
  };
}
