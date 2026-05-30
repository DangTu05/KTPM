import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @Length(2, 200)
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;
}
