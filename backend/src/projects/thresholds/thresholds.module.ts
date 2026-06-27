import { Module } from '@nestjs/common';
import { ThresholdService } from './threshold.service';
import { PrismaService } from '../../common/database/prisma.service';

@Module({
  providers: [ThresholdService, PrismaService],
  exports: [ThresholdService]
})
export class ThresholdsModule {}
