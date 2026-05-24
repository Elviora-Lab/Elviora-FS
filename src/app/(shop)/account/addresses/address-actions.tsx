'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { deleteAddress } from '@/server/actions/addresses.actions';

export function AddressActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function remove() {
    if (!confirm('Delete this address?')) return;
    start(async () => {
      const result = await deleteAddress({ id });
      if (result.success) {
        toast.success('Address removed');
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
