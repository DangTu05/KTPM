import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LoyaltyTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LoyaltyTransactionCreateInput) {
    return this.prisma.loyaltyTransaction.create({ data });
  }

  findManyByAccount(accountId: string) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
