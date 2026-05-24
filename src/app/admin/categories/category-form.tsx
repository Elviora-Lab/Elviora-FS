'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { createCategory } from '@/server/actions/admin/categories.actions';

export function CategoryForm({ parents }: { parents: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get('name') ?? ''),
      slug: String(formData.get('slug') ?? '') || undefined,
      description: String(formData.get('description') ?? '') || undefined,
      parentId: String(formData.get('parentId') ?? '') || undefined,
      sortOrder: Number(formData.get('sortOrder') ?? 0),
      isActive: formData.get('isActive') === 'on',
    };

    start(async () => {
      const result = await createCategory(payload);
      if (result.success) {
        toast.success('Category created');
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
        <Label>Description</Label>
        <Input name="description" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Parent</Label>
        <select
          name="parentId"
          defaultValue=""
          className="h-11 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">— Top-level —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Sort order</Label>
        <Input name="sortOrder" type="number" defaultValue={0} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked
          className="size-4 rounded border-border accent-foreground"
        />
        Active
      </label>
      <div className="mt-2 md:col-span-2">
        <Button type="submit" loading={pending}>
          Create category
        </Button>
      </div>
    </form>
  );
}
