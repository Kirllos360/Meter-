import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../../../../src/projects/dashboard/dashboard.service';
import { PrismaService } from '../../../../src/common/database/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  const projectId = 'proj-1';

  beforeEach(async () => {
    prisma = {
      customer: { count: jest.fn().mockResolvedValue(885) },
      meter: {
        count: jest.fn().mockResolvedValue(1750),
        findMany: jest
          .fn()
          .mockResolvedValue([{ status: 'active' }, { status: 'active' }, { status: 'offline' }])
      },
      invoice: {
        count: jest.fn().mockResolvedValue(45),
        findMany: jest.fn().mockResolvedValue([])
      },
      customerLedgerEntry: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amountDelta: 58175 } })
      },
      reading: {
        findMany: jest.fn().mockResolvedValue([])
      },
      meterAssignment: {
        findMany: jest.fn().mockResolvedValue([])
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }]
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKpis', () => {
    it('should return KPI summary', async () => {
      const result = await service.getKpis(projectId);
      expect(result.kpis).toHaveLength(3);
      expect(result.kpis[0]).toEqual({ label: 'Total Customers', value: 885, change: 5.2 });
      expect(result.meterStatusDistribution).toHaveLength(2);
      expect(result.unpaidInvoices).toBe(45);
      expect(result.collectionRate).toBeGreaterThan(0);
    });
  });

  describe('getConsumptionTrend', () => {
    it('should return empty consumption trend when no readings', async () => {
      const result = await service.getConsumptionTrend(projectId);
      expect(result.data).toEqual([]);
    });

    it('should aggregate readings by month', async () => {
      prisma.reading.findMany.mockResolvedValue([
        { readingAt: new Date('2026-01-15'), consumptionValue: 100, meterId: 'm1' },
        { readingAt: new Date('2026-01-20'), consumptionValue: 50, meterId: 'm2' }
      ]);
      prisma.meter.findMany.mockResolvedValue([
        { id: 'm1', meterType: 'electricity' },
        { id: 'm2', meterType: 'water_child' }
      ]);

      const result = await service.getConsumptionTrend(projectId);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].electricity).toBe(100);
      expect(result.data[0].water).toBe(50);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity items', async () => {
      const result = await service.getRecentActivity(projectId);
      expect(result.items).toEqual([]);
    });
  });
});
