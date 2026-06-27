import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySimCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['available', 'assigned', 'active', 'suspended', 'old', 'reusable', 'retired']
  })
  @IsOptional()
  @IsEnum(['available', 'assigned', 'active', 'suspended', 'old', 'reusable', 'retired'] as const)
  status?: 'available' | 'assigned' | 'active' | 'suspended' | 'old' | 'reusable' | 'retired';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  provider?: string;
}
