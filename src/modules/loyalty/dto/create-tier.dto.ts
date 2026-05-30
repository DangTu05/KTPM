import { IsInt, IsNumber, IsString, Length, Min } from 'class-validator';

export class CreateTierDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsInt()
  @Min(1)
  level!: number;

  @IsInt()
  @Min(0)
  minLifetimePoints!: number;

  @IsNumber()
  @Min(0)
  earnMultiplier!: number;
}
