'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { approveReview, deleteReview } from '@/server/actions/admin/reviews.actions';

export function ReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function approve() {
    start(async () => {
      const result = await approveReview({ id });
      if (result.success) {
        toast.success('Review approved');
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function remove() {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    start(async () => {
      const result = await deleteReview({ id });
      if (result.success) {
        toast.success('Review deleted');
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="mt-2 flex gap-2">
      <Button size="sm" onClick={approve} loading={pending}>
        Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={remove} loading={pending}>
        Delete
      </Button>
    </div>
  );
}
