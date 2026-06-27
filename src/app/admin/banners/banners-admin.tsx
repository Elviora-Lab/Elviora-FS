'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { createBanner, deleteBanner, toggleBanner } from '@/server/actions/admin/banners.actions';

type BannerRow = {
  id: string;
  title: string;
  imageUrl: string;
  position: string;
  redirectUrl: string | null;
  isActive: boolean;
};

const POSITIONS = ['homepage_hero', 'homepage_strip', 'category_top'];

export function BannersAdmin({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    position: 'homepage_hero',
    redirectUrl: '',
  });

  function create(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createBanner(form);
      if (res.success) {
        toast.success('Banner created');
        setForm({ title: '', imageUrl: '', position: 'homepage_hero', redirectUrl: '' });
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  function onToggle(id: string, isActive: boolean) {
    start(async () => {
      const res = await toggleBanner({ id, isActive });
      if (res.success) router.refresh();
      else toast.error(res.message);
    });
  }

  function onDelete(id: string) {
    start(async () => {
      const res = await deleteBanner({ id });
      if (res.success) {
        toast.success('Banner deleted');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">New banner</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="flex flex-col gap-3">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              placeholder="Image URL"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              required
            />
            <select
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Input
              placeholder="Redirect URL (optional)"
              value={form.redirectUrl}
              onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })}
            />
            <Button type="submit" loading={pending} uppercase>
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {banners.length === 0 ? (
          <p className="text-sm text-muted-foreground">No banners yet.</p>
        ) : (
          banners.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-muted">
                  {b.imageUrl ? (
                    <Image
                      src={b.imageUrl}
                      alt={b.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{b.position}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={b.isActive ? 'outline' : 'secondary'}
                  onClick={() => onToggle(b.id, !b.isActive)}
                  disabled={pending}
                >
                  {b.isActive ? 'Active' : 'Hidden'}
                </Button>
                <button
                  type="button"
                  onClick={() => onDelete(b.id)}
                  disabled={pending}
                  className="text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
