import 'server-only';

import { type OrderStatus, type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

/**
 * Admin-side repositories. These intentionally ignore `is_active` /
 * `is_approved` filters so operators see the full state of the catalog.
 */

// ---------- Dashboard ----------

export const adminDashboardRepo = {
  async kpis() {
    const [
      totalRevenue,
      ordersLast30,
      productsCount,
      usersCount,
      pendingReviews,
      lowStockVariants,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.order.count({
        where: { createdAt: { gte: daysAgo(30) } },
      }),
      prisma.product.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.productVariant.count({ where: { isActive: true, stockQuantity: { lt: 10 } } }),
    ]);

    return {
      revenue: Number(totalRevenue._sum.totalAmount ?? 0),
      ordersLast30,
      productsCount,
      usersCount,
      pendingReviews,
      lowStockVariants,
    };
  },

  recentOrders(limit = 5) {
    return prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { email: true, firstName: true } } },
    });
  },
};

function daysAgo(d: number) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

// ---------- Products ----------

export const adminProductsRepo = {
  list(opts: { skip?: number; take?: number; q?: string } = {}) {
    const where: Prisma.ProductWhereInput = opts.q
      ? {
          OR: [
            { name: { contains: opts.q, mode: 'insensitive' } },
            { sku: { contains: opts.q, mode: 'insensitive' } },
          ],
        }
      : {};
    return prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: opts.skip ?? 0,
        take: opts.take ?? 50,
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          images: { where: { isPrimary: true }, take: 1 },
          variants: { select: { stockQuantity: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { sku: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  },

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },

  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },

  updateVariantStock(variantId: string, stockQuantity: number) {
    return prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity },
    });
  },
};

// ---------- Orders ----------

export const adminOrdersRepo = {
  list(opts: { status?: OrderStatus; skip?: number; take?: number } = {}) {
    const where: Prisma.OrderWhereInput = opts.status ? { orderStatus: opts.status } : {};
    return prisma.$transaction([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: opts.skip ?? 0,
        take: opts.take ?? 50,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: true,
        payments: true,
        shipments: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
  },
};

// ---------- Reviews ----------

export const adminReviewsRepo = {
  listPending(opts: { skip?: number; take?: number } = {}) {
    return prisma.$transaction([
      prisma.review.findMany({
        where: { isApproved: false },
        orderBy: { createdAt: 'desc' },
        skip: opts.skip ?? 0,
        take: opts.take ?? 50,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          product: { select: { name: true, slug: true } },
          images: true,
        },
      }),
      prisma.review.count({ where: { isApproved: false } }),
    ]);
  },

  approve(id: string) {
    return prisma.review.update({ where: { id }, data: { isApproved: true } });
  },

  delete(id: string) {
    return prisma.review.delete({ where: { id } });
  },
};

// ---------- Categories ----------

export const adminCategoriesRepo = {
  listAll() {
    return prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
    });
  },

  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};
