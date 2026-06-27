import { ApiProperty } from '@nestjs/swagger';

export class SimEligibilityDto {
  @ApiProperty({ format: 'uuid' })
  simId!: string;

  @ApiProperty()
  eligible!: boolean;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ format: 'date-time', nullable: true, required: false })
  cooldownUntil?: string | null;
}
