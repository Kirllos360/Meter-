import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeterAssignmentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  meterId!: string;

  @ApiProperty({ format: 'uuid' })
  customerId!: string;

  @ApiProperty({ format: 'uuid' })
  unitId!: string;

  @ApiProperty({ enum: ['active', 'ended'] })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  startAt!: Date;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  endAt!: Date | null;
}
