import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PollerService } from './poller.service';

interface ScheduledTask {
  meterId: string;
  meterType: string;
  intervalMs: number;
  config: Record<string, unknown>;
  timer?: ReturnType<typeof setInterval>;
}

@Injectable()
export class PollingScheduler implements OnModuleDestroy {
  private readonly logger = new Logger(PollingScheduler.name);
  private readonly tasks = new Map<string, ScheduledTask>();
  private enabled = false;

  constructor(private readonly pollerService: PollerService) {
    this.enabled = process.env.POLLING_ENABLED === 'true';
  }

  toggle(active: boolean): void {
    this.enabled = active;
    if (!active) {
      this.stopAll();
      this.logger.log('Polling disabled');
    } else {
      this.logger.log('Polling enabled');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  scheduleTask(
    id: string,
    meterId: string,
    meterType: string,
    intervalMs: number,
    config: Record<string, unknown> = {}
  ): void {
    if (this.tasks.has(id)) {
      this.logger.warn(`Task ${id} already scheduled, skipping`);
      return;
    }
    const task: ScheduledTask = { meterId, meterType, intervalMs, config };
    if (this.enabled) {
      task.timer = setInterval(async () => {
        const result = await this.pollerService.pollMeter(meterId, meterType, config);
        if (!result.success) {
          this.logger.error(`Scheduled poll failed: ${meterId} - ${result.error}`);
        }
      }, intervalMs);
    }
    this.tasks.set(id, task);
    this.logger.log(`Scheduled: ${meterId} (${meterType}) every ${intervalMs}ms`);
  }

  unscheduleTask(id: string): void {
    const task = this.tasks.get(id);
    if (task?.timer) clearInterval(task.timer);
    this.tasks.delete(id);
  }

  stopAll(): void {
    for (const [, task] of this.tasks) {
      if (task.timer) clearInterval(task.timer);
    }
    this.tasks.clear();
  }

  getActiveCount(): number {
    return this.tasks.size;
  }

  onModuleDestroy(): void {
    this.stopAll();
  }
}
