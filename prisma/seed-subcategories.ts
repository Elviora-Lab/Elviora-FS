/**
 * Subcategory seeder — idempotent. Run with `npm run db:seed:subcategories`
 * (after `db:seed` or `db:import`).
 *
 * For each top-level merchandising category (Lips / Eyes / Face / Nails):
 *  • upserts its subcategories from the shared `CATEGORY_TREE` taxonomy
 *  • re-assigns products sitting on the parent (or already on one of its
 *    children) to the first subcategory whose keywords match the product name
 *
 * Products that match no subcategory keep their current category, so manual
 * assignments made in the admin are never yanked back to the parent.
 */
import { PrismaClient } from '@prisma/client';

import { CATEGORY_TREE } from '../src/config/taxonomy';

const prisma = new PrismaClient();

async function main() {
  for (const [index, parentDef] of CATEGORY_TREE.entries()) {
    const parent = await prisma.category.findUnique({ where: { slug: parentDef.slug } });
    if (!parent) {
      console.warn(`⚠ Category "${parentDef.slug}" not found — run db:seed or db:import first.`);
      continue;
    }

    // Keep the parent's storefront copy and display order in sync with the
    // taxonomy (Lips, Eyes, Face, Nails).
    const sortOrder = index + 1;
    if (parent.description !== (parentDef.description ?? null) || parent.sortOrder !== sortOrder) {
      await prisma.category.update({
        where: { id: parent.id },
        data: { description: parentDef.description, sortOrder },
      });
    }

    const childIdBySlug = new Map<string, string>();
    for (const sub of parentDef.children) {
      const row = await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          parentId: parent.id,
          sortOrder: sub.sortOrder,
          description: sub.description,
          isActive: true,
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          parentId: parent.id,
          sortOrder: sub.sortOrder,
          description: sub.description,
        },
      });
      childIdBySlug.set(sub.slug, row.id);
    }

    const products = await prisma.product.findMany({
      where: { categoryId: { in: [parent.id, ...childIdBySlug.values()] } },
      select: { id: true, name: true, categoryId: true },
    });

    // Group moves by target so each subcategory is one updateMany.
    const moves = new Map<string, string[]>();
    let unmatched = 0;
    for (const product of products) {
      const name = product.name.toLowerCase();
      const target = parentDef.children.find((sub) =>
        sub.match.some((keyword) => name.includes(keyword)),
      );
      if (!target) {
        if (product.categoryId === parent.id) unmatched += 1;
        continue;
      }
      const targetId = childIdBySlug.get(target.slug)!;
      if (targetId !== product.categoryId) {
        moves.set(targetId, [...(moves.get(targetId) ?? []), product.id]);
      }
    }

    let moved = 0;
    for (const [categoryId, ids] of moves) {
      const { count } = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { categoryId },
      });
      moved += count;
    }

    console.log(
      `${parentDef.name}: ${parentDef.children.length} subcategories upserted, ` +
        `${moved} products re-assigned, ${unmatched} left on parent.`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
