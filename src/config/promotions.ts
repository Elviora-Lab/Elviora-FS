/**
 * Store promotions — single source of truth for time-boxed campaigns.
 *
 * A promotion here drives the on-site surfaces (announcement bar, homepage
 * banner, countdown). The actual discount is enforced by the matching `Coupon`
 * row (create it with `scripts/seed-azadi-coupon.mjs`), so the code below only
 * controls *presentation* — never the money.
 *
 * All timestamps are PKT (+05:00).
 */
export type PromotionPhase = 'teaser' | 'live' | 'ended';

export type Promotion = {
  id: string;
  /** Display name, e.g. "Azadi Sale". */
  name: string;
  /** Short benefit line, e.g. "10% off everything". */
  tagline: string;
  /** Coupon code customers enter at checkout. Must match the seeded Coupon. */
  code: string;
  percentOff: number;
  /** Marketing occasion line. */
  occasion: string;
  startsAt: string;
  endsAt: string;
  /** The date the countdown targets (the "big day"). */
  countdownTo: string;
  /**
   * When true, this campaign is the ONLY promotion while it's LIVE — other
   * coupons and Spend & Save are automatically suppressed until it ends, then
   * restored on their own. Free shipping is unaffected.
   */
  exclusive?: boolean;
};

export const AZADI_SALE: Promotion = {
  id: 'azadi-2026',
  name: 'Azadi Sale',
  tagline: '10% off everything',
  code: 'AZADI10',
  percentOff: 10,
  occasion: '14 August · Independence Day',
  startsAt: '2026-08-01T00:00:00+05:00',
  endsAt: '2026-08-15T23:59:59+05:00',
  countdownTo: '2026-08-14T00:00:00+05:00',
  exclusive: true,
};

/** All promotions, in priority order (first active wins). */
export const PROMOTIONS: Promotion[] = [AZADI_SALE];

export function promotionPhase(p: Promotion, now: Date): PromotionPhase {
  const t = now.getTime();
  if (t < new Date(p.startsAt).getTime()) return 'teaser';
  if (t > new Date(p.endsAt).getTime()) return 'ended';
  return 'live';
}

/**
 * The promotion to surface right now, plus its phase. We surface a promo during
 * its build-up (`teaser`) as well as while `live`, and drop it once `ended`.
 * Returns null when nothing should show.
 */
export function currentPromotion(now: Date = new Date()): {
  promo: Promotion;
  phase: PromotionPhase;
} | null {
  for (const promo of PROMOTIONS) {
    const phase = promotionPhase(promo, now);
    if (phase !== 'ended') return { promo, phase };
  }
  return null;
}

/**
 * The exclusive campaign that is currently LIVE (not merely teasing), if any.
 * The discount engine uses this to pause competing coupons + Spend & Save for
 * the duration of the sale — it returns null before the sale starts and again
 * after it ends, so the other promotions restore themselves automatically.
 */
export function exclusivePromotion(now: Date = new Date()): Promotion | null {
  const active = currentPromotion(now);
  return active && active.phase === 'live' && active.promo.exclusive ? active.promo : null;
}

/** One-line marquee/announcement message for the given promo + phase. */
export function promotionHeadline(promo: Promotion, phase: PromotionPhase): string {
  const starts = new Date(promo.startsAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });
  const ends = new Date(promo.endsAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });
  return phase === 'teaser'
    ? `🇵🇰 ${promo.name} starts ${starts} — ${promo.percentOff}% off everything`
    : `🇵🇰 ${promo.name} — ${promo.percentOff}% off with code ${promo.code} · ends ${ends}`;
}
