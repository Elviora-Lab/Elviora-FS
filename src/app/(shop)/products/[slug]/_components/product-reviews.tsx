import { BadgeCheck } from 'lucide-react';

import { formatDate } from '@/utils/format';

import { Rating } from '@/design-system/primitives/rating';

import { ReviewForm } from './review-form';

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  authorName: string | null;
  user: { firstName: string | null; lastName: string | null } | null;
};

function authorName(r: Pick<ReviewRow, 'user' | 'authorName'>) {
  // Logged-in reviewer → "First L."; guest verified-purchase → shipping name;
  // else a neutral fallback.
  if (r.user) {
    const first = r.user.firstName?.trim() || 'Anonymous';
    const lastInitial = r.user.lastName?.trim()?.[0];
    return lastInitial ? `${first} ${lastInitial}.` : first;
  }
  const guest = r.authorName?.trim();
  if (!guest) return 'Verified buyer';
  // Show first name + last initial only, for privacy.
  const [first, ...rest] = guest.split(/\s+/);
  const lastInitial = rest.length ? rest[rest.length - 1]?.[0] : undefined;
  return lastInitial ? `${first} ${lastInitial}.` : (first ?? 'Verified buyer');
}

export function ProductReviews({
  productId,
  summary,
  reviews,
}: {
  productId: string;
  summary: { average: number; count: number };
  reviews: ReviewRow[];
}) {
  return (
    <section id="reviews" className="flex flex-col gap-6 border-t border-border/60 pt-10">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Reviews</span>
        <div className="flex items-center gap-3">
          <h2 className="editorial-heading text-display-sm">
            {summary.count > 0 ? summary.average.toFixed(1) : 'No reviews yet'}
          </h2>
          {summary.count > 0 ? (
            <Rating value={summary.average} reviewCount={summary.count} size={16} />
          ) : null}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* List */}
        <div className="flex flex-col gap-6">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Be the first to review this product.</p>
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="flex flex-col gap-1.5 border-b border-border/50 pb-5">
                <div className="flex items-center gap-2">
                  <Rating value={r.rating} size={13} />
                  {r.isVerifiedPurchase ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-success">
                      <BadgeCheck className="size-3.5" /> Verified
                    </span>
                  ) : null}
                </div>
                {r.title ? <h3 className="text-sm font-medium">{r.title}</h3> : null}
                {r.comment ? (
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    {r.comment}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground/80">
                  {authorName(r)} · {formatDate(r.createdAt, { dateStyle: 'medium' })}
                </p>
              </article>
            ))
          )}
        </div>

        {/* Write form */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ReviewForm productId={productId} />
        </div>
      </div>
    </section>
  );
}
