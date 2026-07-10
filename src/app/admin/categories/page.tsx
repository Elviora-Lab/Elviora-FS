import { buildMetadata } from '@/lib/seo/metadata';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { CategoryActions } from './category-actions';
import { CategoryForm } from './category-form';

import { adminCategoriesRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Categories', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await adminCategoriesRepo.listAll();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">Categories</h1>
        <p className="text-sm text-muted-foreground">
          The taxonomy that powers navigation, filtering and SEO.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            parents={categories.filter((c) => !c.parentId).map((c) => ({ id: c.id, name: c.name }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All categories</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No categories yet.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.parent?.name ?? '—'}</td>
                    <td className="px-4 py-3">{c._count.products}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.isActive ? 'Active' : 'Hidden'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CategoryActions id={c.id} disabled={c._count.products > 0} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
