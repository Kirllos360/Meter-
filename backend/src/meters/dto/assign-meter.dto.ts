import { IsString, IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignMeterDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  customerId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  unitId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  projectId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  startAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
