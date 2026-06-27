import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { MeterType } from '@prisma/client';

@Injectable()
export class TariffService {
  private readonly logger = new Logger(TariffService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getEffectiveTariff(projectId: string, meterType: MeterType, effectiveDate: Date) {
    const tariff = await this.prisma.tariffPlan.findFirst({
      where: {
        projectId,
        meterType,
        status: 'active',
        effectiveFrom: { lte: effectiveDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveDate } }]
      },
      orderBy: { effectiveFrom: 'desc' }
    });
    return tariff;
  }

  async validateNonOverlap(
    projectId: string,
    meterType: MeterType,
    from: Date,
    to: Date | null,
    excludeId?: string
  ) {
    const where: any = {
      projectId,
      meterType,
      status: 'active',
      effectiveFrom: { lt: to ?? new Date('9999-12-31') },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: from } }]
    };
    if (excludeId) where.id = { not: excludeId };
    const existing = await this.prisma.tariffPlan.findFirst({ where });
    if (existing) throw new BadRequestException('Overlapping tariff window');
  }
}
