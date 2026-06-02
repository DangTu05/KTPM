import { Injectable } from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export type PaginatedResponse = {
  data: OrderWithItems[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.OrderCreateInput): Promise<Order> {
    return this.prisma.order.create({
      data,
      include: { items: true },
    });
  }

  findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async findMany(params: {
    branchId?: string;
    status?: Prisma.OrderWhereInput['status'];
    customerId?: string;
    from?: Date;
    to?: Date;
    skip?: number;
    take?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    const { branchId, status, customerId, from, to, skip, take, page, limit } =
      params;

    const where = {
      ...(branchId ? { branchId } : {}),
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(from || to
        ? {
            placedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [totalItems, data] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip,
        take,
        include: { items: true },
      }),
    ]);

    const safePage = page ?? 1;
    const safeLimit = limit ?? 20;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit);

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        totalItems,
        totalPages,
        hasNext: totalPages !== 0 && safePage < totalPages,
        hasPrev: safePage > 1 && totalPages !== 0,
      },
    };
  }

  update(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });
  }
}
