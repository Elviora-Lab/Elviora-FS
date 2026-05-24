import 'server-only';

import { NotFoundError } from '@/server/http/errors';
import { addressesRepo } from '@/server/repositories/addresses.repo';

export const addressesService = {
  list(userId: string) {
    return addressesRepo.listForUser(userId);
  },

  async create(userId: string, data: Parameters<typeof addressesRepo.create>[1]) {
    return addressesRepo.create(userId, data);
  },

  async getOwned(addressId: string, userId: string) {
    const addr = await addressesRepo.findByIdForUser(addressId, userId);
    if (!addr) throw new NotFoundError('Address not found');
    return addr;
  },
};
