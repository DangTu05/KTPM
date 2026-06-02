import { Injectable } from '@nestjs/common';
import { Prisma, Branch } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BranchRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.BranchCreateInput): Promise<Branch> {
    return this.prisma.branch.create({ data });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    page?: number;
    limit?: number;
  }) {
    const { skip, take, page, limit } = params;

    const [totalItems, data] = await Promise.all([
      this.prisma.branch.count(),
      this.prisma.branch.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
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

  findById(id: string): Promise<Branch | null> {
    return this.prisma.branch.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.BranchUpdateInput): Promise<Branch> {
    return this.prisma.branch.update({ where: { id }, data });
  }

  delete(id: string): Promise<Branch> {
    return this.prisma.branch.delete({ where: { id } });
  }
}
