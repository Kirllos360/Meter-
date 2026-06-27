import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { SimCard } from '@/lib/types';

export function useSimCardsList() {
  return useQuery({
    queryKey: ['sim-cards'],
    queryFn: () => apiGet<SimCard[]>('/sim-cards'),
  });
}

export function useSimCardDetail(id: string) {
  return useQuery({
    queryKey: ['sim-cards', id],
    queryFn: () => apiGet<SimCard>(`/sim-cards/${id}`),
    enabled: !!id,
  });
}
