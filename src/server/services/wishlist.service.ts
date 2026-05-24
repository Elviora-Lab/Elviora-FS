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
    // Cheaper than running both queries: try add → on duplicate, delete instead.
    const ids = new Set(await wishlistRepo.productIdsForUser(userId));
    if (ids.has(productId)) {
      await wishlistRepo.remove(userId, productId);
      return { wishlisted: false };
    }
    await wishlistRepo.add(userId, productId);
    return { wishlisted: true };
  },

  async remove(userId: string, productId: string) {
    await wishlistRepo.remove(userId, productId);
  },
};
