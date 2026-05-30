import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { MembershipTierRepository } from './repositories/membership-tier.repository';
import { LoyaltyAccountRepository } from './repositories/loyalty-account.repository';
import { LoyaltyTransactionRepository } from './repositories/loyalty-transaction.repository';

@Module({
  imports: [PrismaModule],
  controllers: [LoyaltyController],
  providers: [
    LoyaltyService,
    MembershipTierRepository,
    LoyaltyAccountRepository,
    LoyaltyTransactionRepository,
  ],
})
export class LoyaltyModule {}
