import { LoyaltyTxnType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLoyaltyTxnDto {
  @IsEnum(LoyaltyTxnType)
  type!: LoyaltyTxnType;

  @IsInt()
  @Min(1)
  points!: number;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
