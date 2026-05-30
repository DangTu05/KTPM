import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;
}
