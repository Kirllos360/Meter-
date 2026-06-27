import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';

interface ReplaceMeterPayload {
  reason: string;
  replacedAt: string;
  finalReading: number;
  assignDto: {
    customerId: string;
    unitId: string;
    projectId: string;
  };
}

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

export function useReplaceMeter() {
  return useMutation({
    mutationFn: async ({ oldMeterId, newMeterId, data }: { oldMeterId: string; newMeterId: string; data: ReplaceMeterPayload }) => {
      const terminateKey = generateIdempotencyKey();
      await apiPost(`/meters/${oldMeterId}/terminate`, {
        reason: data.reason,
        terminatedAt: data.replacedAt,
        finalReading: data.finalReading,
      }, { headers: { 'Idempotency-Key': terminateKey } });
      const assignKey = generateIdempotencyKey();
      return apiPost(`/meters/${newMeterId}/assign`, {
        reason: `Replacement for meter ${oldMeterId}: ${data.reason}`,
        startAt: data.replacedAt,
        customerId: data.assignDto.customerId,
        unitId: data.assignDto.unitId,
        projectId: data.assignDto.projectId,
      }, { headers: { 'Idempotency-Key': assignKey } });
    },
  });
}
