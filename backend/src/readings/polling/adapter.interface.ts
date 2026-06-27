export interface PollingResult {
  success: boolean;
  reading?: { meterId: string; value: number; timestamp: Date };
  error?: string;
  meterId: string;
}

export interface MeterAdapter {
  readonly meterType: string;
  fetchReading(meterId: string, config: Record<string, unknown>): Promise<PollingResult>;
}
