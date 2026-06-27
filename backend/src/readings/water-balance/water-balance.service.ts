import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { WaterBalanceResponseDto, ChildBreakdownDto } from './dto/water-balance.dto';

@Injectable()
export class WaterBalanceService {
  private readonly logger = new Logger(WaterBalanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWaterBalance(projectId: string, from: Date, to: Date): Promise<WaterBalanceResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, waterDifferenceMode: true }
    });
    if (!project) throw new NotFoundException('Project not found');

    const mainMeters = await this.prisma.meter.findMany({
      where: { projectId, meterType: 'water_main', status: { not: 'retired' } },
      select: { id: true, serialNumber: true }
    });

    if (mainMeters.length === 0) throw new NotFoundException('No water main meters found');

    const mainMeter = mainMeters[0];
    const mainReading = await this.prisma.reading.aggregate({
      where: {
        meterId: mainMeter.id,
        readingAt: { gte: from, lte: to },
        status: { not: 'rejected' }
      },
      _sum: { consumptionValue: true }
    });
    const totalMain = Number(mainReading._sum.consumptionValue ?? 0);

    const childMeters = await this.prisma.meter.findMany({
      where: { parentMainMeterId: mainMeter.id, status: { not: 'retired' } },
      select: { id: true, serialNumber: true }
    });

    let totalChild = 0;
    let missingReadings = false;
    const breakdown: ChildBreakdownDto[] = [];

    for (const child of childMeters) {
      const childReading = await this.prisma.reading.aggregate({
        where: {
          meterId: child.id,
          readingAt: { gte: from, lte: to },
          status: { not: 'rejected' }
        },
        _sum: { consumptionValue: true },
        _count: true
      });
      const consumption = Number(childReading._sum.consumptionValue ?? 0);
      totalChild += consumption;
      const hasData = childReading._count > 0;
      if (!hasData) missingReadings = true;
      breakdown.push({
        childMeterId: child.id,
        childMeterName: child.serialNumber,
        childConsumption: consumption,
        coverageStatus: hasData ? 'covered' : 'missing'
      });
    }

    const variance = totalMain - totalChild;
    const coveragePercentage = totalMain > 0 ? Math.round((totalChild / totalMain) * 100) : 0;

    return {
      mainMeterId: mainMeter.id,
      mainMeterName: mainMeter.serialNumber,
      period: { from, to },
      totalMainConsumption: totalMain,
      totalChildConsumption: totalChild,
      variance,
      coveragePercentage,
      waterDifferenceMode: project.waterDifferenceMode as 'billable' | 'report_only',
      missingReadings,
      perChildBreakdown: breakdown
    };
  }
}
