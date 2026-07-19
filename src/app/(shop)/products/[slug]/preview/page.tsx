import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Eye } from 'lucide-react';

import { buildMetadata } from '@/lib/seo/metadata';

import { ProductDetail } from '../_components/product-detail';

import { requireAdmin } from '@/server/auth/guards';
import { productsService } from '@/server/services/products.service';

type Params = Promise<{ slug: string }>;

// Admin-only preview of a product's storefront page — including hidden ones.
// Always dynamic: it reads the admin session and must never be cached/indexed.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildMetadata({ title: 'Product preview', noIndex: true });

export default async function ProductPreviewPage({ params }: { params: Params }) {
  const { slug } = await params;

  // Gate to admins. A non-admin (or logged-out) visitor gets a 404 rather than
  // a 403, so the preview URL doesn't reveal that a hidden product exists.
  try {
    await requireAdmin();
  } catch {
    notFound();
  }

  let product;
  try {
    product = await productsService.getBySlug(slug, { track: false, allowInactive: true });
  } catch {
    notFound();
  }

  return (
    <>
      <div className="border-b border-brand-amber/30 bg-brand-stone/40 text-brand-slate">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <p className="flex items-center gap-2 text-sm">
            <Eye className="size-4" />
            <span className="font-medium">Admin preview</span>
            <span className="text-brand-slate/70">
              {product.isActive
                ? 'This product is live on the storefront.'
                : 'This product is hidden — not visible to the public.'}
            </span>
          </p>
          <Link
            href={`/admin/products/${product.id}`}
            className="text-xs uppercase tracking-[0.12em] underline underline-offset-4"
          >
            Edit in admin →
          </Link>
        </div>
      </div>

      <ProductDetail slug={slug} product={product} trackView={false} />
    </>
  );
}
