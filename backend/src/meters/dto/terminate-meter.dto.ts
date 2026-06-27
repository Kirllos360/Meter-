import { IsString, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TerminateMeterDto {
  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  terminatedAt!: string;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  finalReading!: number;
}

export class MeterTerminateResultDto {
  @ApiProperty()
  meterStatus!: string;

  @ApiProperty()
  simStatus!: string;

  @ApiProperty()
  simReusable!: boolean;
}
