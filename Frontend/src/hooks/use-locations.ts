import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { Location } from '@/lib/types';

export function useLocationsList(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'locations'],
    queryFn: () => apiGet<Location[]>(`/projects/${projectId}/locations`),
    enabled: !!projectId,
  });
}
