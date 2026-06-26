import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ReadingsModule } from '../readings/readings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingController } from './billing.controller';
import { TariffStudioController } from './tariff-studio.controller';
import { TariffService } from './tariffs/tariff.service';
import { TariffEngineService } from './tariff-engine.service';
import { PeriodService } from './periods/period.service';
import { LedgerService } from './ledger.service';
import { BillingStateService } from './billing-state.service';
import { WaterDifferencePolicy } from './water-difference.policy';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule, ReadingsModule, NotificationsModule],
  controllers: [BillingController, TariffStudioController],
  providers: [TariffService, PeriodService, LedgerService, BillingStateService, WaterDifferencePolicy, TariffEngineService],
  exports: [TariffService, PeriodService, LedgerService, BillingStateService, WaterDifferencePolicy]
})
export class BillingModule {}
