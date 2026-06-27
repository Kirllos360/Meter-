import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class PeriodService {
  private readonly logger = new Logger(PeriodService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getActivePeriod(projectId: string, date: Date) {
    return this.prisma.billingPeriod.findFirst({
      where: { projectId, startDate: { lte: date }, endDate: { gte: date }, status: 'open' }
    });
  }

  async createPeriod(data: {
    projectId: string;
    periodCode: string;
    startDate: Date;
    endDate: Date;
    createdBy: string;
  }) {
    const overlap = await this.prisma.billingPeriod.findFirst({
      where: {
        projectId: data.projectId,
        startDate: { lt: data.endDate },
        endDate: { gt: data.startDate }
      }
    });
    if (overlap) throw new BadRequestException('Overlapping billing period');
    return this.prisma.billingPeriod.create({
      data: {
        projectId: data.projectId,
        periodCode: data.periodCode,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'open',
        createdBy: data.createdBy,
        updatedBy: data.createdBy
      }
    });
  }
}
