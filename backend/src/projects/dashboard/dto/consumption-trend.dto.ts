import { ApiProperty } from '@nestjs/swagger';

class ConsumptionMonth {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  electricity!: number;

  @ApiProperty()
  water!: number;
}

export class ConsumptionTrendDto {
  @ApiProperty({ type: [ConsumptionMonth] })
  data!: ConsumptionMonth[];
}
