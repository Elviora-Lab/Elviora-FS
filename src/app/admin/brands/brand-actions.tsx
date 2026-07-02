'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { deleteBrand } from '@/server/actions/admin/brands.actions';

export function BrandActions({ id, disabled }: { id: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function remove() {
    if (disabled) {
      toast.error('Reassign products before deleting this brand.');
      return;
    }
    if (!confirm('Delete this brand?')) return;
    start(async () => {
      const result = await deleteBrand({ id });
      if (result.success) {
        toast.success('Brand deleted');
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
