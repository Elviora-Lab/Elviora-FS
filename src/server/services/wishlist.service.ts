import 'server-only';

import { wishlistRepo } from '@/server/repositories/wishlist.repo';
import { toProductCard } from '@/server/services/_mappers/product.mapper';

export const wishlistService = {
  /** Returns full ProductCardData rows so the page can render `<ProductCard>` directly. */
  async list(userId: string) {
    const rows = await wishlistRepo.listForUser(userId);
    return rows.map((row) => toProductCard(row.product));
  },

  productIds(userId: string) {
    return wishlistRepo.productIdsForUser(userId);
  },

  async toggle(userId: string, productId: string): Promise<{ wishlisted: boolean }> {
    // Delete-first, no read: the deleteMany is the atomic "was it on?" check,
    // so rapid double-toggles serialize at the DB instead of racing a stale
    // read. Nothing deleted → it was off → add (upsert absorbs a concurrent
    // add racing this one).
    const { count } = await wishlistRepo.remove(userId, productId);
    if (count > 0) return { wishlisted: false };
    await wishlistRepo.add(userId, productId);
    return { wishlisted: true };
  },

  async remove(userId: string, productId: string) {
    await wishlistRepo.remove(userId, productId);
  },
};
