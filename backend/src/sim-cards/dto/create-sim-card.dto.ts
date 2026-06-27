import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSimCardDto {
  @ApiProperty()
  @IsString()
  iccid!: string;

  @ApiProperty()
  @IsString()
  msisdn!: string;

  @ApiProperty()
  @IsString()
  provider!: string;

  @ApiProperty()
  @IsString()
  ipAddress!: string;

  @ApiProperty({ enum: ['dynamic', 'static'] })
  @IsEnum(['dynamic', 'static'] as const)
  ipType!: 'dynamic' | 'static';
}
