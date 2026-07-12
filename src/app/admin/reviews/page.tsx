import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/utils/format';

import { Rating } from '@/design-system/primitives/rating';
import { Card, CardContent } from '@/components/ui/card';

import { ReviewActions } from './review-actions';

import { adminReviewsRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Reviews', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const [items, total] = await adminReviewsRepo.listPending({ take: 50 });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">Reviews moderation</h1>
        <p className="text-sm text-muted-foreground">
          {total} pending — approve to publish on the product page.
        </p>
      </header>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            All caught up — no reviews are awaiting moderation.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((r) => {
            const author =
              (r.user
                ? [r.user.firstName, r.user.lastName].filter(Boolean).join(' ').trim() ||
                  r.user.email
                : r.authorName?.trim()) || 'Verified buyer';
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">
                        on{' '}
                        <Link href={`/products/${r.product.slug}`} className="hover:underline">
                          {r.product.name}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {author} · {formatDate(r.createdAt, { dateStyle: 'medium' })}
                      </div>
                    </div>
                    <Rating value={r.rating} />
                  </div>
                  {r.title ? <div className="font-serif text-lg font-light">{r.title}</div> : null}
                  {r.comment ? (
                    <p className="whitespace-pre-line text-sm leading-relaxed">{r.comment}</p>
                  ) : null}
                  {r.images.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {r.images.map((img) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={img.id}
                          src={img.imageUrl}
                          alt=""
                          className="size-16 rounded-md object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                  <ReviewActions id={r.id} />
                </CardContent>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
