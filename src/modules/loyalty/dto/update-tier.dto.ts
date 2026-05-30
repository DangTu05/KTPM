import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class UpdateTierDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minLifetimePoints?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earnMultiplier?: number;
}
