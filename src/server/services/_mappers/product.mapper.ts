import 'server-only';

import type { ProductCardData } from '@/design-system/patterns/product-card';

/**
 * Shape Prisma returns from `productsRepo.list` (relevant fields only).
 * Loose-typed on purpose so this mapper accepts both list + detail rows.
 */
type PrismaProductForCard = {
  id: string;
  slug: string;
  name: string;
  price: unknown; // Prisma.Decimal
  comparePrice?: unknown | null;
  isFeatured?: boolean;
  createdAt?: Date | string;
  brand?: { name?: string | null } | null;
  images?: Array<{ imageUrl: string | null }> | null;
};

/** Products published within this window get the "New" badge. */
const NEW_BADGE_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Map a Prisma product row to the `ProductCardData` shape the UI expects.
 * Guarantees `imageUrl` is always a string — empty string when no image is
 * attached, which the `<ProductCard>` renders as a styled placeholder.
 */
export function toProductCard(p: PrismaProductForCard): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brandLine: p.brand?.name ?? undefined,
    imageUrl: p.images?.[0]?.imageUrl ?? '',
    price: toNumber(p.price),
    compareAt: p.comparePrice != null ? toNumber(p.comparePrice) : undefined,
    currency: 'PKR',
    isNew: p.createdAt ? Date.now() - new Date(p.createdAt).getTime() < NEW_BADGE_WINDOW_MS : false,
    isBestseller: Boolean(p.isFeatured),
  };
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  // Prisma Decimal exposes toNumber() / toString()
  if (v && typeof (v as { toNumber?: () => number }).toNumber === 'function') {
    return (v as { toNumber: () => number }).toNumber();
  }
  if (v && typeof (v as { toString?: () => string }).toString === 'function') {
    return Number((v as { toString: () => string }).toString());
  }
  return 0;
}
