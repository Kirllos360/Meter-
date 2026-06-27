import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';

interface TerminateMeterPayload {
  reason: string;
  terminatedAt: string;
  finalReading: number;
}

interface TerminateMeterResult {
  meterStatus: string;
  simStatus: string;
  simReusable: boolean;
}

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

export function useTerminateMeter() {
  return useMutation({
    mutationFn: ({ meterId, data }: { meterId: string; data: TerminateMeterPayload }) =>
      apiPost<TerminateMeterResult>(`/meters/${meterId}/terminate`, data, {
        headers: { 'Idempotency-Key': generateIdempotencyKey() }
      }),
  });
}
