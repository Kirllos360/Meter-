import { IsString, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  customerCode!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['individual', 'company', 'tenant', 'owner'] })
  @IsEnum(['individual', 'company', 'tenant', 'owner'] as const)
  customerType!: 'individual' | 'company' | 'tenant' | 'owner';

  @ApiProperty()
  @IsString()
  nationalOrCommercialId!: string;
}
