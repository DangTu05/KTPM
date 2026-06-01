import { Injectable } from '@nestjs/common';
import { MenuItem, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MenuItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    branchId: string,
    data: Prisma.MenuItemCreateWithoutBranchInput & {
      categoryId?: string | null;
    },
  ): Promise<MenuItem> {
    const { categoryId, ...rest } = data;
    return this.prisma.menuItem.create({
      data: {
        ...rest,
        branch: { connect: { id: branchId } },
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      },
    });
  }

  findManyByBranch(branchId: string): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { branchId },
      orderBy: [{ isAvailable: 'desc' }, { name: 'asc' }],
    });
  }

  findManyByBranchPaginated(
    branchId: string,
    args: { skip: number; take: number },
  ): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { branchId },
      skip: args.skip,
      take: args.take,
      orderBy: [{ isAvailable: 'desc' }, { name: 'asc' }],
    });
  }

  countByBranch(branchId: string): Promise<number> {
    return this.prisma.menuItem.count({ where: { branchId } });
  }

  findById(id: string): Promise<MenuItem | null> {
    return this.prisma.menuItem.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.MenuItemUpdateInput): Promise<MenuItem> {
    return this.prisma.menuItem.update({ where: { id }, data });
  }

  delete(id: string): Promise<MenuItem> {
    return this.prisma.menuItem.delete({ where: { id } });
  }
}
