import { Injectable } from '@nestjs/common';
import { LoyaltyAccount, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LoyaltyAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.loyaltyAccount.findUnique({
      where: { id },
      include: { customer: true, tier: true },
    });
  }

  findByCustomerId(customerId: string) {
    return this.prisma.loyaltyAccount.findUnique({
      where: { customerId },
      include: { customer: true, tier: true },
    });
  }

  create(data: Prisma.LoyaltyAccountCreateInput): Promise<LoyaltyAccount> {
    return this.prisma.loyaltyAccount.create({ data });
  }

  update(id: string, data: Prisma.LoyaltyAccountUpdateInput) {
    return this.prisma.loyaltyAccount.update({
      where: { id },
      data,
      include: { customer: true, tier: true },
    });
  }
}
