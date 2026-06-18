import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [DatabaseModule, BillingModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
