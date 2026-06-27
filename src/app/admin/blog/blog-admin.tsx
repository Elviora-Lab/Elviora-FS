'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { formatDate } from '@/utils/format';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { createBlogPost, deleteBlogPost, togglePublish } from '@/server/actions/admin/blog.actions';

type PostRow = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  publishedAt: Date | null;
};

export function BlogAdmin({ posts }: { posts: PostRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ title: '', content: '', isPublished: false });

  function create(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createBlogPost(form);
      if (res.success) {
        toast.success('Post created');
        setForm({ title: '', content: '', isPublished: false });
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  function onToggle(id: string, isPublished: boolean) {
    start(async () => {
      const res = await togglePublish({ id, isPublished });
      if (res.success) router.refresh();
      else toast.error(res.message);
    });
  }

  function onDelete(id: string) {
    start(async () => {
      const res = await deleteBlogPost({ id });
      if (res.success) {
        toast.success('Post deleted');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">New post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="flex flex-col gap-3">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Content…"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              required
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              Publish immediately
            </label>
            <Button type="submit" loading={pending} uppercase>
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          posts.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.isPublished
                      ? `Published ${p.publishedAt ? formatDate(p.publishedAt, { dateStyle: 'medium' }) : ''}`
                      : 'Draft'}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={p.isPublished ? 'outline' : 'secondary'}
                  onClick={() => onToggle(p.id, !p.isPublished)}
                  disabled={pending}
                >
                  {p.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
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
