import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export interface ChildBreakdown {
  childMeterId: string;
  childMeterName: string;
  childConsumption: number;
  coverageStatus: 'covered' | 'partial' | 'missing';
}

export interface WaterBalanceData {
  mainMeterId: string;
  mainMeterName: string;
  totalMainConsumption: number;
  totalChildConsumption: number;
  variance: number;
  coveragePercentage: number;
  waterDifferenceMode: 'billable' | 'report_only';
  missingReadings: boolean;
  perChildBreakdown: ChildBreakdown[];
}

export function useWaterBalance(projectId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['water-balance', projectId, from, to],
    queryFn: () => apiGet<WaterBalanceData>(`/projects/${projectId}/water-balance?from=${from}&to=${to}`),
    enabled: !!projectId && !!from && !!to,
  });
}
