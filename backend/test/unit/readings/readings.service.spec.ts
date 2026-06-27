import { Test, TestingModule } from '@nestjs/testing';
import { ReadingsService } from '../../../src/readings/readings.service';
import { PrismaService } from '../../../src/common/database/prisma.service';
import { ThresholdService } from '../../../src/projects/thresholds/threshold.service';

describe('ReadingsService', () => {
  let service: ReadingsService;
  let prisma: any;
  let thresholdService: any;

  const mockReading = {
    id: 'rdg-1',
    meterId: 'mtr-1',
    projectId: 'proj-1',
    customerIdSnapshot: '',
    unitIdSnapshot: '',
    readingValue: 1234.56,
    readingAt: new Date('2026-05-29T12:00:00Z'),
    source: 'manual',
    previousReadingValue: null,
    consumptionValue: null,
    status: 'valid',
    rawPayload: null,
    enteredBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    prisma = {
      reading: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(mockReading)
      }
    };

    thresholdService = {
      getProfile: jest.fn().mockResolvedValue({
        maxConsumptionPerDay: null,
        maxConsumptionPerMonth: 50000,
        minConsumptionPerMonth: 0,
        alertOnNegativeConsumption: true,
        alertOnZeroConsumption: false,
        alertOnSpike: true,
        spikeMultiplier: 3
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ThresholdService, useValue: thresholdService }
      ]
    }).compile();

    service = module.get<ReadingsService>(ReadingsService);
  });

  it('should create a reading and set status to valid for normal consumption', async () => {
    prisma.reading.findFirst.mockResolvedValue({
      ...mockReading,
      readingValue: 1000,
      previousReadingValue: 800,
      consumptionValue: 200
    });

    const result = await service.createReading(
      {
        meterId: 'mtr-1',
        projectId: 'proj-1',
        readingValue: 1200,
        readingAt: '2026-06-01T12:00:00Z',
        source: 'manual'
      },
      'user-1'
    );
    expect(result.status).toBe('valid');
    expect(result.consumptionValue).toBe(200);
  });

  it('should flag negative consumption as suspicious', async () => {
    prisma.reading.findFirst.mockResolvedValue({
      ...mockReading,
      readingValue: 1500,
      previousReadingValue: 1000,
      consumptionValue: 500
    });

    const result = await service.createReading(
      {
        meterId: 'mtr-1',
        projectId: 'proj-1',
        readingValue: 800,
        readingAt: '2026-06-15T12:00:00Z',
        source: 'manual'
      },
      'user-1'
    );
    expect(result.status).toBe('suspicious');
  });

  it('should flag over-threshold consumption as pending_review', async () => {
    prisma.reading.findFirst.mockResolvedValue({
      ...mockReading,
      readingValue: 1000,
      previousReadingValue: 500,
      consumptionValue: 500
    });

    thresholdService.getProfile.mockResolvedValue({
      maxConsumptionPerMonth: 200,
      alertOnNegativeConsumption: true,
      alertOnZeroConsumption: false,
      alertOnSpike: false
    });

    const result = await service.createReading(
      {
        meterId: 'mtr-1',
        projectId: 'proj-1',
        readingValue: 60000,
        readingAt: '2026-07-01T12:00:00Z',
        source: 'manual'
      },
      'user-1'
    );
    expect(result.status).toBe('pending_review');
  });
});
