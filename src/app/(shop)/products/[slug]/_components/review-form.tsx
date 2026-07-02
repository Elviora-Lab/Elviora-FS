'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/cn';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { submitReview } from '@/server/actions/review.actions';

export function ReviewForm({ productId }: { productId: string }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Customer accounts are disabled, so guests can't post reviews — the form is
  // simply hidden (reviews stay read-only). Signed-in staff still see it.
  if (!isAuthenticated) return null;

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
      const res = await submitReview({
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });
      if (res.success) {
        toast.success('Thank you — your review is awaiting approval.');
        setRating(0);
        setTitle('');
        setComment('');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-md border border-border p-5">
      <h3 className="font-serif text-lg font-light">Write a review</h3>

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
                'size-6 transition-colors',
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
        placeholder="Share your experience…"
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
  );
}
