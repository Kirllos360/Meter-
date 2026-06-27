import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ enum: ['zone', 'building', 'floor', 'unit'] })
  @IsEnum(['zone', 'building', 'floor', 'unit'] as const)
  nodeType!: 'zone' | 'building' | 'floor' | 'unit';

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
