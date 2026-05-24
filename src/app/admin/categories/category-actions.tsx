'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { deleteCategory } from '@/server/actions/admin/categories.actions';

export function CategoryActions({ id, disabled }: { id: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function remove() {
    if (disabled) {
      toast.error('Reassign products before deleting this category.');
      return;
    }
    if (!confirm('Delete this category?')) return;
    start(async () => {
      const result = await deleteCategory({ id });
      if (result.success) {
        toast.success('Category deleted');
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button size="sm" variant="ghost" onClick={remove} loading={pending}>
      Delete
    </Button>
  );
}
