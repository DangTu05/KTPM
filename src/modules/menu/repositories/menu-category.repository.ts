import { Injectable } from '@nestjs/common';
import { MenuCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MenuCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    branchId: string,
    data: Prisma.MenuCategoryCreateWithoutBranchInput,
  ): Promise<MenuCategory> {
    return this.prisma.menuCategory.create({
      data: {
        ...data,
        branch: { connect: { id: branchId } },
      },
    });
  }

  findManyByBranch(branchId: string): Promise<MenuCategory[]> {
    return this.prisma.menuCategory.findMany({
      where: { branchId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findManyByBranchPaginated(
    branchId: string,
    args: { skip: number; take: number },
  ): Promise<MenuCategory[]> {
    return this.prisma.menuCategory.findMany({
      where: { branchId },
      skip: args.skip,
      take: args.take,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  countByBranch(branchId: string): Promise<number> {
    return this.prisma.menuCategory.count({ where: { branchId } });
  }

  findById(id: string): Promise<MenuCategory | null> {
    return this.prisma.menuCategory.findUnique({ where: { id } });
  }

  update(
    id: string,
    data: Prisma.MenuCategoryUpdateInput,
  ): Promise<MenuCategory> {
    return this.prisma.menuCategory.update({ where: { id }, data });
  }

  delete(id: string): Promise<MenuCategory> {
    return this.prisma.menuCategory.delete({ where: { id } });
  }
}
