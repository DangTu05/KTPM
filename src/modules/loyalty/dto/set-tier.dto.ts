import { IsOptional, IsString } from 'class-validator';

export class SetTierDto {
  @IsOptional()
  @IsString()
  tierId?: string;
}
