'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { StarRatingInput } from '@/components/commerce/star-rating-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { submitReview } from '@/server/actions/review.actions';

export function ReviewForm({ productId }: { productId: string }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [rating, setRating] = useState(0);
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

      <StarRatingInput value={rating} onChange={setRating} />

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        aria-label="Review title (optional)"
        maxLength={200}
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience…"
        aria-label="Your review"
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
