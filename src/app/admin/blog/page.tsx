import { buildMetadata } from '@/lib/seo/metadata';

import { BlogAdmin } from './blog-admin';

import { adminBlogRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Journal', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const posts = await adminBlogRepo.list();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">Journal</h1>
        <p className="text-sm text-muted-foreground">Editorial posts powering /blog.</p>
      </header>
      <BlogAdmin posts={posts} />
    </div>
  );
}
