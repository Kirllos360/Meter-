import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { SyncController } from './sync.controller';
import { SyncOrchestratorService } from './sync-orchestrator.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SyncController],
  providers: [SyncOrchestratorService],
  exports: [SyncOrchestratorService],
})
export class SyncModule {}
