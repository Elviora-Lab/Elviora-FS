'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { createBrand } from '@/server/actions/admin/brands.actions';

export function BrandForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get('name') ?? ''),
      slug: String(formData.get('slug') ?? '') || undefined,
      description: String(formData.get('description') ?? '') || undefined,
      logo: String(formData.get('logo') ?? '') || undefined,
      isActive: formData.get('isActive') === 'on',
    };

    start(async () => {
      const result = await createBrand(payload);
      if (result.success) {
        toast.success('Brand created');
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>Name</Label>
        <Input name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Slug (optional)</Label>
        <Input name="slug" placeholder="auto from name" />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label>Description (shown on the brand page)</Label>
        <Input name="description" />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label>Logo URL (optional)</Label>
        <Input name="logo" type="url" placeholder="https://…" />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked
          className="size-4 rounded border-border accent-foreground"
        />
        Active (visible on the storefront)
      </label>
      <div className="md:col-span-2">
        <Button type="submit" loading={pending}>
          Create brand
        </Button>
      </div>
    </form>
  );
}
