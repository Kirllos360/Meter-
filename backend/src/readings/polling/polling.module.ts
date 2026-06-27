import { Module } from '@nestjs/common';
import { PollerService } from './poller.service';
import { PollingScheduler } from './polling.scheduler';

@Module({
  providers: [PollerService, PollingScheduler],
  exports: [PollerService, PollingScheduler]
})
export class PollingModule {}
