'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Star } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/cn';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { submitGuestReview } from '@/server/actions/review.actions';

export type ReviewableProduct = {
  productId: string;
  name: string;
  imageUrl: string | null;
  reviewed: boolean;
};

export function GuestReviewForm({
  token,
  products,
}: {
  token: string;
  products: ReviewableProduct[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {products.map((p) => (
        <ProductReviewCard key={p.productId} token={token} product={p} />
      ))}
    </div>
  );
}

function ProductReviewCard({ token, product }: { token: string; product: ReviewableProduct }) {
  const [done, setDone] = useState(product.reviewed);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error('Please choose a star rating.');
      return;
    }
    if (comment.trim().length < 10) {
      toast.error('Please write at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitGuestReview({
        token,
        productId: product.productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });
      if (res.success) {
        toast.success('Thank you — your review is awaiting approval.');
        setDone(true);
      } else {
        toast.error(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-5">
      <div className="flex items-center gap-3">
        <span className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : null}
        </span>
        <h3 className="font-serif text-lg font-light">{product.name}</h3>
      </div>

      {done ? (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <Check className="size-4" /> Thanks — your review has been submitted.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i} star${i > 1 ? 's' : ''}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    'size-7 transition-colors',
                    (hover || rating) >= i
                      ? 'fill-brand-gold text-brand-gold'
                      : 'text-muted-foreground/40',
                  )}
                />
              </button>
            ))}
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            maxLength={200}
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How did it wear? What did you love?"
            rows={4}
            maxLength={4000}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div>
            <Button type="submit" loading={submitting} uppercase>
              Submit review
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
