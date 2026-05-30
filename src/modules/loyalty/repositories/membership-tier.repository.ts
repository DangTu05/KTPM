import { Injectable } from '@nestjs/common';
import { MembershipTier, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MembershipTierRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MembershipTierCreateInput): Promise<MembershipTier> {
    return this.prisma.membershipTier.create({ data });
  }

  findMany(): Promise<MembershipTier[]> {
    return this.prisma.membershipTier.findMany({ orderBy: { level: 'asc' } });
  }

  findById(id: string): Promise<MembershipTier | null> {
    return this.prisma.membershipTier.findUnique({ where: { id } });
  }

  update(
    id: string,
    data: Prisma.MembershipTierUpdateInput,
  ): Promise<MembershipTier> {
    return this.prisma.membershipTier.update({ where: { id }, data });
  }

  delete(id: string): Promise<MembershipTier> {
    return this.prisma.membershipTier.delete({ where: { id } });
  }
}
