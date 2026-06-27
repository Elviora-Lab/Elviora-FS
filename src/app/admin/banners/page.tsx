import { buildMetadata } from '@/lib/seo/metadata';

import { BannersAdmin } from './banners-admin';

import { adminBannersRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Banners', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const banners = await adminBannersRepo.list();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">Banners</h1>
        <p className="text-sm text-muted-foreground">Hero banners and editorial creative.</p>
      </header>
      <BannersAdmin banners={banners} />
    </div>
  );
}
