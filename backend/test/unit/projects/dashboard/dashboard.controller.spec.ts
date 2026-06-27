import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../../../../src/projects/dashboard/dashboard.controller';
import { DashboardService } from '../../../../src/projects/dashboard/dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: any;

  const projectId = 'proj-1';

  beforeEach(async () => {
    service = {
      getKpis: jest.fn().mockResolvedValue({
        kpis: [],
        meterStatusDistribution: [],
        alertSeverityCounts: [],
        unpaidInvoices: 0,
        outstandingBalance: 0,
        collectionRate: 100
      }),
      getConsumptionTrend: jest.fn().mockResolvedValue({ data: [] }),
      getRecentActivity: jest.fn().mockResolvedValue({ items: [] })
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: service }]
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get KPIs', async () => {
    await controller.getKpis(projectId);
    expect(service.getKpis).toHaveBeenCalledWith(projectId);
  });

  it('should get consumption', async () => {
    await controller.getConsumption(projectId);
    expect(service.getConsumptionTrend).toHaveBeenCalledWith(projectId);
  });

  it('should get activity with default limit', async () => {
    await controller.getActivity(projectId, undefined);
    expect(service.getRecentActivity).toHaveBeenCalledWith(projectId, 10);
  });

  it('should get activity with custom limit', async () => {
    await controller.getActivity(projectId, '5');
    expect(service.getRecentActivity).toHaveBeenCalledWith(projectId, 5);
  });
});
