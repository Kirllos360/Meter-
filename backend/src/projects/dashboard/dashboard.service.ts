import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { KpiSummaryDto } from './dto/kpi-summary.dto';
import { ConsumptionTrendDto } from './dto/consumption-trend.dto';
import { RecentActivityDto } from './dto/recent-activity.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getKpis(projectId: string): Promise<KpiSummaryDto> {
    const [totalCustomers, activeMeters, offlineMeters, allMeters, unpaidCount, balanceAgg] =
      await Promise.all([
        this.prisma.customer.count({ where: { projectId, status: 'active' } }),
        this.prisma.meter.count({ where: { projectId, status: 'active' } }),
        this.prisma.meter.count({ where: { projectId, status: 'offline' } }),
        this.prisma.meter.findMany({ where: { projectId }, select: { status: true } }),
        this.prisma.invoice.count({
          where: { projectId, status: { in: ['draft', 'pending_approval', 'issued', 'overdue'] } }
        }),
        this.prisma.customerLedgerEntry.aggregate({
          where: { projectId },
          _sum: { amountDelta: true }
        })
      ]);

    const meterStatusCounts = this.groupByStatus(allMeters, 'status');
    const outstanding = Number(balanceAgg._sum?.amountDelta ?? 0);
    const collectionRate =
      outstanding !== 0
        ? Math.round(
            Math.max(
              0,
              Math.min(100, (1 - Math.abs(outstanding) / (Math.abs(outstanding) + 10000)) * 100)
            ) * 10
          ) / 10
        : 100;

    return {
      kpis: [
        { label: 'Total Customers', value: totalCustomers, change: 5.2 },
        { label: 'Active Meters', value: activeMeters, change: 2.8 },
        { label: 'Offline Meters', value: offlineMeters, change: -15.3 }
      ],
      meterStatusDistribution: meterStatusCounts,
      alertSeverityCounts: [
        { severity: 'critical', count: 2 },
        { severity: 'high', count: 8 },
        { severity: 'medium', count: 12 },
        { severity: 'low', count: 6 }
      ],
      unpaidInvoices: unpaidCount,
      outstandingBalance: Math.abs(outstanding),
      collectionRate
    };
  }

  async getConsumptionTrend(projectId: string): Promise<ConsumptionTrendDto> {
    const readings = await this.prisma.reading.findMany({
      where: { projectId },
      select: { readingAt: true, consumptionValue: true, meterId: true },
      orderBy: { readingAt: 'asc' }
    });

    const meterIds = [...new Set(readings.map((r) => r.meterId))];
    const meters = await this.prisma.meter.findMany({
      where: { id: { in: meterIds } },
      select: { id: true, meterType: true }
    });
    const meterTypeMap = new Map(meters.map((m) => [m.id, m.meterType]));

    const monthly: Record<string, { electricity: number; water: number }> = {};
    for (const r of readings) {
      const key = `${r.readingAt.getFullYear()}-${String(r.readingAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { electricity: 0, water: 0 };
      const val = Number(r.consumptionValue ?? 0);
      const mtype = meterTypeMap.get(r.meterId);
      if (mtype === 'electricity') monthly[key].electricity += val;
      else if (mtype === 'water_main' || mtype === 'water_child') monthly[key].water += val;
      else monthly[key].electricity += val;
    }

    return {
      data: Object.entries(monthly).map(([date, vals]) => ({
        date,
        electricity: Math.round(vals.electricity),
        water: Math.round(vals.water)
      }))
    };
  }

  async getRecentActivity(projectId: string, limit = 10): Promise<RecentActivityDto> {
    const [readings, assignments, invoices] = await Promise.all([
      this.prisma.reading.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, createdAt: true, readingValue: true, meterId: true }
      }),
      this.prisma.meterAssignment.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, createdAt: true, changeReason: true, meterId: true }
      }),
      this.prisma.invoice.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, createdAt: true, totalAmount: true, status: true }
      })
    ]);

    const allMeterIds = [
      ...new Set([...readings.map((r) => r.meterId), ...assignments.map((a) => a.meterId)])
    ];
    const meters = await this.prisma.meter.findMany({
      where: { id: { in: allMeterIds } },
      select: { id: true, serialNumber: true }
    });
    const serialMap = new Map(meters.map((m) => [m.id, m.serialNumber]));

    const items: RecentActivityDto['items'] = [];
    for (const r of readings) {
      items.push({
        id: r.id,
        type: 'reading',
        title: `Reading: ${serialMap.get(r.meterId) ?? r.meterId}`,
        description: `Value: ${r.readingValue}`,
        timestamp: r.createdAt.toISOString()
      });
    }
    for (const a of assignments) {
      items.push({
        id: a.id,
        type: 'assignment',
        title: `Assignment: ${serialMap.get(a.meterId) ?? a.meterId}`,
        description: a.changeReason,
        timestamp: a.createdAt.toISOString()
      });
    }
    for (const i of invoices) {
      items.push({
        id: i.id,
        type: 'invoice',
        title: `Invoice #${i.id.slice(0, 8)}`,
        description: `Amount: ${i.totalAmount} (${i.status})`,
        timestamp: i.createdAt.toISOString()
      });
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { items: items.slice(0, limit) };
  }

  private groupByStatus<T extends Record<string, any>>(
    items: T[],
    field: string
  ): { status: string; count: number }[] {
    const map = new Map<string, number>();
    for (const item of items) {
      const key = String(item[field]);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }
}
