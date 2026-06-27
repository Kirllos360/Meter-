import { Test, TestingModule } from '@nestjs/testing';
import { ThresholdService } from '../../../../src/projects/thresholds/threshold.service';
import { PrismaService } from '../../../../src/common/database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('ThresholdService', () => {
  let service: ThresholdService;
  let prisma: any;

  const mockThreshold = {
    id: 'th-1',
    projectId: 'proj-1',
    meterType: 'electricity',
    maxConsumptionPerDay: new Decimal(5000),
    maxConsumptionPerMonth: new Decimal(100000),
    minConsumptionPerMonth: new Decimal(10),
    alertOnNegativeConsumption: true,
    alertOnZeroConsumption: false,
    alertOnSpike: true,
    spikeMultiplier: new Decimal(3),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    prisma = {
      projectThreshold: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ThresholdService, { provide: PrismaService, useValue: prisma }]
    }).compile();

    service = module.get<ThresholdService>(ThresholdService);
  });

  it('should return default thresholds when no profile exists', async () => {
    const profile = await service.getProfile('proj-unknown');
    expect(profile.maxConsumptionPerMonth).toBe(50000);
    expect(profile.alertOnNegativeConsumption).toBe(true);
  });

  it('should return project thresholds when profile exists', async () => {
    prisma.projectThreshold.findUnique.mockResolvedValue(mockThreshold);
    const profile = await service.getProfile('proj-1');
    expect(profile.maxConsumptionPerMonth).toBe(100000);
    expect(profile.maxConsumptionPerDay).toBe(5000);
  });

  it('should return defaults via getDefaults()', () => {
    const defaults = service.getDefaults();
    expect(defaults.maxConsumptionPerMonth).toBe(50000);
    expect(defaults.alertOnSpike).toBe(true);
  });

  it('should handle null fields by returning defaults', async () => {
    prisma.projectThreshold.findUnique.mockResolvedValue({
      ...mockThreshold,
      maxConsumptionPerDay: null,
      maxConsumptionPerMonth: null
    });
    const profile = await service.getProfile('proj-1');
    expect(profile.maxConsumptionPerDay).toBeNull();
  });
});
