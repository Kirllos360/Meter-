import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { ReadingsModule } from '../readings/readings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingController } from './billing.controller';
import { TariffService } from './tariffs/tariff.service';
import { PeriodService } from './periods/period.service';
import { LedgerService } from './ledger.service';
import { WaterDifferencePolicy } from './water-difference.policy';

@Module({
  imports: [DatabaseModule, ReadingsModule, NotificationsModule],
  controllers: [BillingController],
  providers: [TariffService, PeriodService, LedgerService, WaterDifferencePolicy],
  exports: [TariffService, PeriodService, LedgerService, WaterDifferencePolicy]
})
export class BillingModule {}
