import { IsUUID, IsNumber, IsDateString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReadingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  meterId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  projectId!: string;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  readingValue!: number;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  readingAt!: string;

  @ApiProperty({ enum: ['manual', 'import', 'automatic'] })
  @IsEnum(['manual', 'import', 'automatic'] as const)
  source!: 'manual' | 'import' | 'automatic';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rawPayload?: Record<string, unknown>;
}
