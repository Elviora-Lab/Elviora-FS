import 'server-only';

import { adminCategoriesRepo } from '@/server/repositories/admin.repo';

export type CategoryOptionGroup = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

/**
 * All categories grouped parent → children (in sort order) for the product
 * form's category select. Includes inactive categories so operators can
 * assign ahead of a launch.
 */
export async function getCategoryOptions(): Promise<CategoryOptionGroup[]> {
  const all = await adminCategoriesRepo.listAll();
  return all
    .filter((c) => !c.parentId)
    .map((parent) => ({
      id: parent.id,
      name: parent.name,
      children: all
        .filter((c) => c.parentId === parent.id)
        .map((c) => ({ id: c.id, name: c.name })),
    }));
}
