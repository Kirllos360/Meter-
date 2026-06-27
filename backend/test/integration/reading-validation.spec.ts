import { NestExpressApplication } from '@nestjs/platform-express';
import { createTestApp } from '../contract/setup';
import { PrismaService } from '../../src/common/database/prisma.service';

jest.setTimeout(30000);

describe('Reading Validation Thresholds (integration)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  let prisma: any;

  const meterId = '00000000-0000-4000-8000-000000000001';
  const projectId = '00000000-0000-4000-8000-000000000002';

  const validPayload = {
    meterId,
    projectId,
    readingValue: 1234.56,
    readingAt: '2026-05-29T12:00:00.000Z',
    source: 'manual'
  };

  function makeMockReading(overrides: Record<string, unknown> = {}) {
    return {
      id: 'mock-reading-id',
      meterId,
      projectId,
      readingValue: 1000,
      readingAt: new Date('2026-05-01T12:00:00Z'),
      source: 'manual',
      consumptionValue: null,
      previousReadingValue: null,
      status: 'valid',
      rawPayload: null,
      customerIdSnapshot: '',
      unitIdSnapshot: '',
      enteredBy: 'test-user',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    request = testApp.request;
    authHeader = testApp.authHeader;

    prisma = app.get(PrismaService);
    prisma.projectThreshold.findUnique.mockResolvedValue(null);
    prisma.reading.findMany.mockResolvedValue([]);
  });

  afterAll(async () => {
    await app.close();
  });

  function authPost(url: string) {
    return request.post(url).set('Authorization', authHeader);
  }

  describe('Consumption calculation', () => {
    it('should compute consumption = current - previous when previous reading exists', async () => {
      prisma.reading.findFirst.mockResolvedValueOnce(makeMockReading({ readingValue: 1000 }));
      prisma.reading.create.mockResolvedValueOnce(
        makeMockReading({ readingValue: 1200, consumptionValue: 200 })
      );

      const first = await authPost('/api/v1/readings').send({
        ...validPayload,
        readingValue: 1000,
        readingAt: '2026-05-01T12:00:00Z'
      });
      expect(first.status).toBe(201);

      prisma.reading.findFirst.mockResolvedValueOnce(makeMockReading({ readingValue: 1000 }));
      prisma.reading.create.mockResolvedValueOnce(
        makeMockReading({ readingValue: 1200, consumptionValue: 200 })
      );

      const second = await authPost('/api/v1/readings').send({
        ...validPayload,
        readingValue: 1200,
        readingAt: '2026-05-29T12:00:00Z'
      });
      expect(second.status).toBe(201);
      expect(Number(second.body.consumptionValue)).toBeCloseTo(200);
    });

    it('should set consumption to null for first reading', async () => {
      prisma.reading.findFirst.mockResolvedValueOnce(null);
      prisma.reading.create.mockResolvedValueOnce(
        makeMockReading({ readingValue: 5000, consumptionValue: null })
      );

      const res = await authPost('/api/v1/readings').send({
        ...validPayload,
        readingValue: 5000,
        readingAt: '2026-06-01T12:00:00Z'
      });
      expect(res.status).toBe(201);
      expect(res.body.consumptionValue).toBeNull();
    });

    it('should use previous reading from same meter ordered by readingAt', async () => {
      prisma.reading.findFirst.mockResolvedValueOnce(makeMockReading({ readingValue: 1200 }));
      prisma.reading.create.mockResolvedValueOnce(
        makeMockReading({ readingValue: 2200, consumptionValue: 1000 })
      );

      const res = await authPost('/api/v1/readings').send({
        ...validPayload,
        readingValue: 2200,
        readingAt: '2026-07-01T12:00:00Z'
      });
      expect(res.status).toBe(201);
      expect(Number(res.body.consumptionValue)).toBeCloseTo(1000);
    });
  });

  describe('Validation thresholds', () => {
    it('should flag negative consumption as suspicious', async () => {
      prisma.reading.findFirst.mockResolvedValueOnce(makeMockReading({ readingValue: 1000 }));
      prisma.reading.create.mockResolvedValueOnce(
        makeMockReading({ readingValue: 800, consumptionValue: -200, status: 'suspicious' })
      );

      const res = await authPost('/api/v1/readings').send({
        ...validPayload,
        readingValue: 800,
        readingAt: '2026-08-01T12:00:00Z'
      });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('suspicious');
    });

    it('should flag over-threshold consumption as pending_review', async () => {
      prisma.reading.findFirst.mockResolvedValueOnce(makeMockReading({ readingValue: 1000 }));
      prisma.reading.create.mockResolvedValueOnce(
        makeMockReading({ readingValue: 60000, consumptionValue: 59000, status: 'pending_review' })
      );

      const res = await authPost('/api/v1/readings').send({
        ...validPayload,
        readingValue: 60000,
        readingAt: '2026-09-01T12:00:00Z'
      });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending_review');
    });

    it('should keep normal consumption as valid', async () => {
      prisma.reading.findFirst.mockResolvedValueOnce(makeMockReading({ readingValue: 1000 }));
      prisma.reading.create.mockResolvedValueOnce(
        makeMockReading({ readingValue: 2500, consumptionValue: 1500, status: 'valid' })
      );

      const res = await authPost('/api/v1/readings').send({
        ...validPayload,
        readingValue: 2500,
        readingAt: '2026-10-01T12:00:00Z'
      });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('valid');
    });
  });

  describe('Unique constraint', () => {
    it('should reject duplicate (meterId, readingAt, source)', async () => {
      prisma.reading.findFirst.mockResolvedValueOnce(null);
      prisma.reading.create.mockResolvedValueOnce(makeMockReading({ readingValue: 3000 }));
      const payload = {
        ...validPayload,
        readingValue: 3000,
        readingAt: '2026-11-01T12:00:00Z',
        source: 'manual'
      };
      await authPost('/api/v1/readings').send(payload);

      prisma.reading.findFirst.mockResolvedValueOnce(makeMockReading({ readingValue: 3000 }));
      prisma.reading.create.mockRejectedValueOnce({
        code: 'P2002',
        message: 'Unique constraint failed'
      });
      const duplicate = await authPost('/api/v1/readings').send(payload);
      expect(duplicate.status).toBe(422);
    });
  });
});
