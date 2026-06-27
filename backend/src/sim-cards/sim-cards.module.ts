import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { SimCardsController } from './sim-cards.controller';
import { SimCardsService } from './sim-cards.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SimCardsController],
  providers: [SimCardsService],
  exports: [SimCardsService]
})
export class SimCardsModule {}
