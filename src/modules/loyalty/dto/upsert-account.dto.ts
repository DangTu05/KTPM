import { IsOptional, IsString } from 'class-validator';

export class UpsertAccountDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  tierId?: string;
}
