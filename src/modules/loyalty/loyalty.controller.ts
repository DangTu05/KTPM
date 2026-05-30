import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { SetTierDto } from './dto/set-tier.dto';
import { CreateLoyaltyTxnDto } from './dto/create-loyalty-txn.dto';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}

  // Tiers
  @Post('tiers')
  createTier(@Body() dto: CreateTierDto) {
    return this.service.createTier(dto);
  }

  @Get('tiers')
  listTiers() {
    return this.service.listTiers();
  }

  @Patch('tiers/:tierId')
  updateTier(@Param('tierId') tierId: string, @Body() dto: UpdateTierDto) {
    return this.service.updateTier(tierId, dto);
  }

  @Delete('tiers/:tierId')
  deleteTier(@Param('tierId') tierId: string) {
    return this.service.deleteTier(tierId);
  }

  // Accounts
  @Get('accounts/by-customer/:customerId')
  getOrCreateAccount(@Param('customerId') customerId: string) {
    return this.service.getOrCreateAccountByCustomer(customerId);
  }

  @Get('accounts/:accountId')
  getAccount(@Param('accountId') accountId: string) {
    return this.service.getAccount(accountId);
  }

  @Patch('accounts/:accountId/tier')
  setTier(@Param('accountId') accountId: string, @Body() dto: SetTierDto) {
    return this.service.setTier(accountId, dto.tierId);
  }

  @Get('accounts/:accountId/transactions')
  listTransactions(@Param('accountId') accountId: string) {
    return this.service.listTransactions(accountId);
  }

  @Post('accounts/:accountId/transactions')
  createTransaction(
    @Param('accountId') accountId: string,
    @Body() dto: CreateLoyaltyTxnDto,
  ) {
    return this.service.createTransaction(accountId, dto);
  }
}
