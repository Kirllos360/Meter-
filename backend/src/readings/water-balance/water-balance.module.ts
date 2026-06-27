import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { WaterBalanceController } from './water-balance.controller';
import { WaterBalanceService } from './water-balance.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WaterBalanceController],
  providers: [WaterBalanceService],
  exports: [WaterBalanceService]
})
export class WaterBalanceModule {}
