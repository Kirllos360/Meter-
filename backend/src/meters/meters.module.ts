import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MetersController } from './meters.controller';
import { MetersService } from './meters.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [MetersController],
  providers: [MetersService],
  exports: [MetersService]
})
export class MetersModule {}
