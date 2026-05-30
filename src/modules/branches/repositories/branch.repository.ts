import { Injectable } from '@nestjs/common';
import { Prisma, Branch } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BranchRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.BranchCreateInput): Promise<Branch> {
    return this.prisma.branch.create({ data });
  }

  findMany(): Promise<Branch[]> {
    return this.prisma.branch.findMany({ orderBy: { createdAt: 'desc' } });
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
