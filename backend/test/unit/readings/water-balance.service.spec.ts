import { Test, TestingModule } from '@nestjs/testing';
import { WaterBalanceService } from '../../../src/readings/water-balance/water-balance.service';
import { PrismaService } from '../../../src/common/database/prisma.service';

function makeMocks() {
  return {
    project: { findUnique: jest.fn() },
    meter: { findMany: jest.fn() },
    reading: { aggregate: jest.fn() }
  };
}

async function createService(mocks: ReturnType<typeof makeMocks>) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [WaterBalanceService, { provide: PrismaService, useValue: mocks }]
  }).compile();
  return module.get<WaterBalanceService>(WaterBalanceService);
}

describe('WaterBalanceService', () => {
  it('should calculate correctly', async () => {
    const m = makeMocks();
    m.project.findUnique.mockResolvedValue({ id: 'p1', waterDifferenceMode: 'billable' });
    m.meter.findMany.mockResolvedValueOnce([{ id: 'm1', serialNumber: 'WM-1' }]);
    m.meter.findMany.mockResolvedValueOnce([
      { id: 'c1', serialNumber: 'WC-1' },
      { id: 'c2', serialNumber: 'WC-2' }
    ]);
    m.reading.aggregate.mockResolvedValueOnce({ _sum: { consumptionValue: 1000 } });
    m.reading.aggregate.mockResolvedValueOnce({ _sum: { consumptionValue: 400 }, _count: 1 });
    m.reading.aggregate.mockResolvedValueOnce({ _sum: { consumptionValue: 350 }, _count: 1 });
    const svc = await createService(m);
    const r = await svc.getWaterBalance('p1', new Date('2026-01-01'), new Date('2026-01-31'));
    expect(r.totalMainConsumption).toBe(1000);
    expect(r.totalChildConsumption).toBe(750);
    expect(r.variance).toBe(250);
  });

  it('should flag missing readings', async () => {
    const m = makeMocks();
    m.project.findUnique.mockResolvedValue({ id: 'p1', waterDifferenceMode: 'billable' });
    m.meter.findMany.mockResolvedValueOnce([{ id: 'm1', serialNumber: 'WM-1' }]);
    m.meter.findMany.mockResolvedValueOnce([{ id: 'c1', serialNumber: 'WC-1' }]);
    m.reading.aggregate.mockResolvedValueOnce({ _sum: { consumptionValue: 1000 } });
    m.reading.aggregate.mockResolvedValueOnce({ _sum: { consumptionValue: 0 }, _count: 0 });
    const svc = await createService(m);
    const r = await svc.getWaterBalance('p1', new Date(), new Date());
    expect(r.missingReadings).toBe(true);
  });

  it('should throw on missing project', async () => {
    const m = makeMocks();
    m.project.findUnique.mockResolvedValue(null);
    const svc = await createService(m);
    await expect(svc.getWaterBalance('bad', new Date(), new Date())).rejects.toThrow(
      'Project not found'
    );
  });

  it('should throw on no main meters', async () => {
    const m = makeMocks();
    m.project.findUnique.mockResolvedValue({ id: 'p1', waterDifferenceMode: 'billable' });
    m.meter.findMany.mockResolvedValue([]);
    const svc = await createService(m);
    await expect(svc.getWaterBalance('p1', new Date(), new Date())).rejects.toThrow(
      'No water main meters'
    );
  });

  it('should handle zero consumption', async () => {
    const m = makeMocks();
    m.project.findUnique.mockResolvedValue({ id: 'p1', waterDifferenceMode: 'report_only' });
    m.meter.findMany.mockResolvedValueOnce([{ id: 'm1', serialNumber: 'WM-1' }]);
    m.meter.findMany.mockResolvedValueOnce([]);
    m.reading.aggregate.mockResolvedValue({ _sum: { consumptionValue: 0 } });
    const svc = await createService(m);
    const r = await svc.getWaterBalance('p1', new Date(), new Date());
    expect(r.totalMainConsumption).toBe(0);
    expect(r.coveragePercentage).toBe(0);
  });
});
