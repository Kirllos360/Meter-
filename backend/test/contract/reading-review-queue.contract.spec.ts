import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createTestApp,
  loadContract,
  getOperation,
  getResponseSchema,
  validateResponseBody,
  validateStatus,
  getExpectedStatuses
} from './setup';
import { PrismaService } from '../../src/common/database/prisma.service';

jest.setTimeout(30000);

describe('GET /readings/review-queue (listReadingReviewQueue)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  const operationId = 'listReadingReviewQueue';

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    request = testApp.request;
    authHeader = testApp.authHeader;

    const prisma: any = app.get(PrismaService);
    prisma.reading.findMany.mockResolvedValue([]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Contract definition', () => {
    it('should define listReadingReviewQueue operation', () => {
      const op = getOperation(operationId);
      expect(op).not.toBeNull();
      expect(op!.method).toBe('GET');
      expect(op!.path).toBe('/readings/review-queue');
    });

    it('should expect 200 status code', () => {
      expect(getExpectedStatuses(operationId)).toEqual([200]);
    });

    it('should have optional query params', () => {
      const op = getOperation(operationId);
      const params = op!.operation.parameters as Record<string, unknown>[];
      const paramNames = params.map((p) => (p as Record<string, unknown>).name);
      expect(paramNames).toContain('projectId');
      expect(paramNames).toContain('status');
    });
  });

  describe('Response schema validation', () => {
    it('should validate 200 response with items array', () => {
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();
      const sample = { items: [] };
      const result = validateResponseBody(schema!, sample);
      expect(result.valid).toBe(true);
    });

    it('should validate 200 response with Reading items', () => {
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();
      const sample = {
        items: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            meterId: '00000000-0000-0000-0000-000000000002',
            status: 'suspicious',
            consumptionValue: null,
            projectThresholdProfile: null
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            meterId: '00000000-0000-0000-0000-000000000004',
            status: 'pending_review',
            consumptionValue: 500.25,
            projectThresholdProfile: 'default'
          }
        ]
      };
      const result = validateResponseBody(schema!, sample);
      expect(result.valid).toBe(true);
    });

    it('should accept response without items (items not required in spec)', () => {
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();
      const result = validateResponseBody(schema!, {});
      expect(result.valid).toBe(true);
    });
  });

  describe('HTTP endpoint', () => {
    it('should return a valid status code', async () => {
      const res = await request
        .get('/api/v1/readings/review-queue')
        .set('Authorization', authHeader);
      expect(validateStatus(operationId, res.status)).toBe(true);
    });
  });
});
