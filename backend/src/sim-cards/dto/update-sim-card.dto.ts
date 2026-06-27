import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSimCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iccid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  msisdn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ enum: ['dynamic', 'static'] })
  @IsOptional()
  @IsEnum(['dynamic', 'static'] as const)
  ipType?: 'dynamic' | 'static';

  @ApiPropertyOptional({
    enum: ['available', 'assigned', 'active', 'suspended', 'old', 'reusable', 'retired']
  })
  @IsOptional()
  @IsEnum(['available', 'assigned', 'active', 'suspended', 'old', 'reusable', 'retired'] as const)
  status?: 'available' | 'assigned' | 'active' | 'suspended' | 'old' | 'reusable' | 'retired';

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  cooldownUntil?: string | null;
}
