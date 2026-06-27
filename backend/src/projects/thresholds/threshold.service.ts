import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface ThresholdProfile {
  maxConsumptionPerDay?: number | null;
  maxConsumptionPerMonth?: number | null;
  minConsumptionPerMonth?: number | null;
  alertOnNegativeConsumption?: boolean;
  alertOnZeroConsumption?: boolean;
  alertOnSpike?: boolean;
  spikeMultiplier?: number;
}

const DEFAULT_THRESHOLDS: ThresholdProfile = {
  maxConsumptionPerDay: null,
  maxConsumptionPerMonth: 50000,
  minConsumptionPerMonth: 0,
  alertOnNegativeConsumption: true,
  alertOnZeroConsumption: false,
  alertOnSpike: true,
  spikeMultiplier: 3
};

@Injectable()
export class ThresholdService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(projectId: string): Promise<ThresholdProfile> {
    const record = await this.prisma.projectThreshold.findUnique({
      where: { projectId }
    });
    if (!record) return DEFAULT_THRESHOLDS;
    return {
      maxConsumptionPerDay: record.maxConsumptionPerDay
        ? Number(record.maxConsumptionPerDay)
        : null,
      maxConsumptionPerMonth: record.maxConsumptionPerMonth
        ? Number(record.maxConsumptionPerMonth)
        : null,
      minConsumptionPerMonth: record.minConsumptionPerMonth
        ? Number(record.minConsumptionPerMonth)
        : null,
      alertOnNegativeConsumption: record.alertOnNegativeConsumption ?? true,
      alertOnZeroConsumption: record.alertOnZeroConsumption ?? false,
      alertOnSpike: record.alertOnSpike ?? true,
      spikeMultiplier: record.spikeMultiplier ? Number(record.spikeMultiplier) : 3
    };
  }

  getDefaults(): ThresholdProfile {
    return { ...DEFAULT_THRESHOLDS };
  }
}
