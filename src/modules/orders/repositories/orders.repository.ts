import { Injectable } from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

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

  findMany(params: {
    branchId?: string;
    status?: Prisma.OrderWhereInput['status'];
    customerId?: string;
    from?: Date;
    to?: Date;
  }) {
    const { branchId, status, customerId, from, to } = params;

    return this.prisma.order.findMany({
      where: {
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
      },
      orderBy: { placedAt: 'desc' },
      include: { items: true },
    });
  }

  update(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });
  }
}
