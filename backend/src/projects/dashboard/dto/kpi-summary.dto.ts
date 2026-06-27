import { ApiProperty } from '@nestjs/swagger';

class KpiItem {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: number;

  @ApiProperty()
  change!: number;
}

class MeterStatusCount {
  @ApiProperty()
  status!: string;

  @ApiProperty()
  count!: number;
}

class AlertSeverityCount {
  @ApiProperty()
  severity!: string;

  @ApiProperty()
  count!: number;
}

export class KpiSummaryDto {
  @ApiProperty({ type: [KpiItem] })
  kpis!: KpiItem[];

  @ApiProperty({ type: [MeterStatusCount] })
  meterStatusDistribution!: MeterStatusCount[];

  @ApiProperty({ type: [AlertSeverityCount] })
  alertSeverityCounts!: AlertSeverityCount[];

  @ApiProperty()
  unpaidInvoices!: number;

  @ApiProperty()
  outstandingBalance!: number;

  @ApiProperty()
  collectionRate!: number;
}
