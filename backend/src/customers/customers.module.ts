import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService]
})
export class CustomersModule {}
