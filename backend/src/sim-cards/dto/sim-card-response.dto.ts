import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimCardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  iccid!: string;

  @ApiProperty()
  msisdn!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  ipAddress!: string;

  @ApiProperty({ enum: ['dynamic', 'static'] })
  ipType!: string;

  @ApiProperty({
    enum: ['available', 'assigned', 'active', 'suspended', 'old', 'reusable', 'retired']
  })
  status!: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  cooldownUntil!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
