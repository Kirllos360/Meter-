import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export interface SimEligibility {
  simId: string;
  eligible: boolean;
  reason: string;
  cooldownUntil?: string | null;
}

export function useSimEligibility(simId: string) {
  return useQuery({
    queryKey: ['sim-cards', simId, 'eligibility'],
    queryFn: () => apiGet<SimEligibility>(`/sim-cards/${simId}/eligibility`),
    enabled: !!simId,
    staleTime: 30000,
  });
}
