import { buildMetadata } from '@/lib/seo/metadata';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { BrandActions } from './brand-actions';
import { BrandForm } from './brand-form';

import { adminBrandsRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Brands', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function AdminBrandsPage() {
  const brands = await adminBrandsRepo.listAll();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">Brands</h1>
        <p className="text-sm text-muted-foreground">
          The houses in the catalog — each gets a storefront page and a product filter.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create brand</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All brands</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No brands yet.
                  </td>
                </tr>
              ) : (
                brands.map((b) => (
                  <tr key={b.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.slug}</td>
                    <td className="px-4 py-3">{b._count.products}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {b.isActive ? 'Active' : 'Hidden'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <BrandActions id={b.id} disabled={b._count.products > 0} />
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
