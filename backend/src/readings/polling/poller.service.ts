import { Injectable, Logger } from '@nestjs/common';
import { MeterAdapter, PollingResult } from './adapter.interface';

interface PendingPoll {
  meterId: string;
  adapter: MeterAdapter;
  config: Record<string, unknown>;
  retriesLeft: number;
}

@Injectable()
export class PollerService {
  private readonly logger = new Logger(PollerService.name);
  private readonly adapters = new Map<string, MeterAdapter>();
  private readonly processedKeys = new Set<string>();
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY_MS = 1000;

  registerAdapter(adapter: MeterAdapter): void {
    this.adapters.set(adapter.meterType, adapter);
    this.logger.log(`Registered adapter: ${adapter.meterType}`);
  }

  async pollMeter(
    meterId: string,
    meterType: string,
    config: Record<string, unknown> = {}
  ): Promise<PollingResult> {
    const adapter = this.adapters.get(meterType);
    if (!adapter)
      return { success: false, error: `No adapter for meter type: ${meterType}`, meterId };

    const idempotencyKey = `poll-${meterId}-${Date.now()}`;
    if (this.processedKeys.has(idempotencyKey)) {
      return { success: false, error: 'Duplicate poll prevented', meterId };
    }
    this.processedKeys.add(idempotencyKey);
    if (this.processedKeys.size > 10000) this.processedKeys.clear();

    const poll: PendingPoll = { meterId, adapter, config, retriesLeft: this.MAX_RETRIES };
    return this.executeWithRetry(poll, idempotencyKey);
  }

  private async executeWithRetry(
    poll: PendingPoll,
    key: string,
    attempt = 1
  ): Promise<PollingResult> {
    try {
      const result = await poll.adapter.fetchReading(poll.meterId, poll.config);
      if (result.success) {
        this.logger.log(`Poll success: ${poll.meterId} (attempt ${attempt})`);
        return result;
      }
      throw new Error(result.error || 'Unknown polling error');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (poll.retriesLeft > 0) {
        const delay = this.BASE_DELAY_MS * Math.pow(2, this.MAX_RETRIES - poll.retriesLeft);
        this.logger.warn(
          `Poll failed: ${poll.meterId}, retrying in ${delay}ms (${poll.retriesLeft} left): ${message}`
        );
        await new Promise((r) => setTimeout(r, delay));
        poll.retriesLeft--;
        return this.executeWithRetry(poll, key, attempt + 1);
      }
      this.logger.error(`Poll failed: ${poll.meterId} after ${attempt} attempts: ${message}`);
      return { success: false, error: message, meterId: poll.meterId };
    }
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.adapters.keys());
  }
}
