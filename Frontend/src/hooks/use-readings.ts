import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import type { Reading } from '@/lib/types';

export interface CreateReadingPayload {
  meterId: string;
  projectId: string;
  readingValue: number;
  readingAt: string;
  source: 'manual' | 'import' | 'automatic';
  rawPayload?: Record<string, unknown>;
}

export function useReadingsList(projectId?: string) {
  return useQuery({
    queryKey: projectId ? ['readings', projectId] : ['readings'],
    queryFn: () => apiGet<Reading[]>(projectId ? `/readings?projectId=${projectId}` : '/readings'),
  });
}

export function useReadingDetail(id: string) {
  return useQuery({
    queryKey: ['readings', id],
    queryFn: () => apiGet<Reading>(`/readings/${id}`),
    enabled: !!id,
  });
}

export function useCreateReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReadingPayload) =>
      apiPost<Reading>('/readings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    },
  });
}
