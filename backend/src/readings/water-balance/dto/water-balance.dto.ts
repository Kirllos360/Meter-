export class ChildBreakdownDto {
  childMeterId!: string;
  childMeterName!: string;
  childConsumption!: number;
  coverageStatus!: 'covered' | 'partial' | 'missing';
}

export class WaterBalanceResponseDto {
  mainMeterId!: string;
  mainMeterName!: string;
  period!: { from: Date; to: Date };
  totalMainConsumption!: number;
  totalChildConsumption!: number;
  variance!: number;
  coveragePercentage!: number;
  waterDifferenceMode!: 'billable' | 'report_only';
  missingReadings!: boolean;
  perChildBreakdown!: ChildBreakdownDto[];
}
