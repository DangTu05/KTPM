import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoyaltyTxnType, Prisma } from '@prisma/client';
import { Prisma as PrismaNs } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { CreateLoyaltyTxnDto } from './dto/create-loyalty-txn.dto';
import { MembershipTierRepository } from './repositories/membership-tier.repository';
import { LoyaltyAccountRepository } from './repositories/loyalty-account.repository';
import { LoyaltyTransactionRepository } from './repositories/loyalty-transaction.repository';

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tierRepo: MembershipTierRepository,
    private readonly accountRepo: LoyaltyAccountRepository,
    private readonly txnRepo: LoyaltyTransactionRepository,
  ) {}

  // Tiers
  createTier(dto: CreateTierDto) {
    const data: Prisma.MembershipTierCreateInput = {
      name: dto.name,
      level: dto.level,
      minLifetimePoints: dto.minLifetimePoints,
      earnMultiplier: new PrismaNs.Decimal(dto.earnMultiplier),
    };
    return this.tierRepo.create(data);
  }

  listTiers() {
    return this.tierRepo.findMany();
  }

  async updateTier(id: string, dto: UpdateTierDto) {
    const tier = await this.tierRepo.findById(id);
    if (!tier) throw new NotFoundException('Tier not found');

    const data: Prisma.MembershipTierUpdateInput = {
      name: dto.name,
      level: dto.level,
      minLifetimePoints: dto.minLifetimePoints,
      ...(dto.earnMultiplier !== undefined
        ? { earnMultiplier: new PrismaNs.Decimal(dto.earnMultiplier) }
        : {}),
    };

    return this.tierRepo.update(id, data);
  }

  async deleteTier(id: string) {
    const tier = await this.tierRepo.findById(id);
    if (!tier) throw new NotFoundException('Tier not found');
    return this.tierRepo.delete(id);
  }

  // Accounts
  async getOrCreateAccountByCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const existing = await this.accountRepo.findByCustomerId(customerId);
    if (existing) return existing;

    return this.accountRepo.create({
      customer: { connect: { id: customerId } },
      pointsBalance: 0,
      lifetimePoints: 0,
    });
  }

  async getAccount(accountId: string) {
    const account = await this.accountRepo.findById(accountId);
    if (!account) throw new NotFoundException('Loyalty account not found');
    return account;
  }

  async setTier(accountId: string, tierId?: string) {
    await this.getAccount(accountId);

    if (tierId) {
      const tier = await this.tierRepo.findById(tierId);
      if (!tier) throw new NotFoundException('Tier not found');
      return this.accountRepo.update(accountId, {
        tier: { connect: { id: tierId } },
      });
    }

    return this.accountRepo.update(accountId, { tier: { disconnect: true } });
  }

  listTransactions(accountId: string) {
    return this.txnRepo.findManyByAccount(accountId);
  }

  async createTransaction(accountId: string, dto: CreateLoyaltyTxnDto) {
    const account = await this.getAccount(accountId);

    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });
      if (!order) throw new NotFoundException('Order not found');
    }

    const delta = dto.type === LoyaltyTxnType.REDEEM ? -dto.points : dto.points;
    const newBalance = account.pointsBalance + delta;
    if (newBalance < 0) throw new BadRequestException('Insufficient points');

    // Transaction + update balance atomically
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.loyaltyTransaction.create({
        data: {
          account: { connect: { id: accountId } },
          ...(dto.orderId ? { order: { connect: { id: dto.orderId } } } : {}),
          type: dto.type,
          points: dto.points,
          note: dto.note,
        },
      });

      await tx.loyaltyAccount.update({
        where: { id: accountId },
        data: {
          pointsBalance: newBalance,
          lifetimePoints:
            dto.type === LoyaltyTxnType.EARN
              ? { increment: dto.points }
              : undefined,
        },
      });

      return created;
    });
  }
}
