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

describe('POST /readings (createReading)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  let prisma: any;
  const operationId = 'createReading';

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    request = testApp.request;
    authHeader = testApp.authHeader;

    prisma = app.get(PrismaService);
    prisma.reading.create.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      meterId: '11111111-1111-4111-8111-111111111111',
      readingValue: 1234.56,
      readingAt: new Date('2026-05-29T12:00:00.000Z'),
      source: 'manual',
      status: 'valid',
      consumptionValue: null,
      projectThresholdProfile: null,
      rawPayload: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    prisma.reading.findFirst.mockResolvedValue(null);
    prisma.projectThreshold.findUnique.mockResolvedValue(null);
    prisma.reading.findMany.mockResolvedValue([]);
    prisma.meter.findUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'active',
      serialNumber: 'TEST',
      meterType: 'electricity',
      projectId: '22222222-2222-4222-8222-222222222222',
      brand: 'Test',
      model: 'T1',
      installationDate: new Date(),
      activationDate: new Date(),
      terminationDate: null,
      locationId: null,
      parentMainMeterId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test',
      updatedBy: 'test'
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Contract definition', () => {
    it('should define createReading operation', () => {
      const op = getOperation(operationId);
      expect(op).not.toBeNull();
      expect(op!.method).toBe('POST');
      expect(op!.path).toBe('/readings');
    });

    it('should expect 201 and 422 status codes', () => {
      const statuses = getExpectedStatuses(operationId);
      expect(statuses).toContain(201);
      expect(statuses).toContain(422);
    });

    it('should have ReadingCreateRequest with 5 required fields', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.ReadingCreateRequest as Record<string, unknown>;
      expect(reqSchema).toBeDefined();
      const required = reqSchema.required as string[];
      expect(required).toContain('meterId');
      expect(required).toContain('projectId');
      expect(required).toContain('readingValue');
      expect(required).toContain('readingAt');
      expect(required).toContain('source');
    });

    it('should have ReadingCreateRequest source enum', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const props = (schemas.ReadingCreateRequest as Record<string, unknown>).properties as Record<
        string,
        unknown
      >;
      expect((props.source as Record<string, unknown>).enum).toEqual([
        'manual',
        'import',
        'automatic'
      ]);
    });
  });

  describe('Request schema validation', () => {
    const validBody = {
      meterId: '11111111-1111-4111-8111-111111111111',
      projectId: '22222222-2222-4222-8222-222222222222',
      readingValue: 1234.56,
      readingAt: '2026-05-29T12:00:00.000Z',
      source: 'manual'
    };

    it('should validate a valid ReadingCreateRequest', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(
        schemas.ReadingCreateRequest as Record<string, unknown>,
        validBody
      );
      expect(result.valid).toBe(true);
    });

    it('should accept all source enum values', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.ReadingCreateRequest as Record<string, unknown>;
      for (const source of ['manual', 'import', 'automatic']) {
        const result = validateResponseBody(reqSchema, { ...validBody, source });
        expect(result.valid).toBe(true);
      }
    });

    it('should accept optional rawPayload', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const body = { ...validBody, rawPayload: { deviceId: 'dev-001', rssi: -65 } };
      const result = validateResponseBody(
        schemas.ReadingCreateRequest as Record<string, unknown>,
        body
      );
      expect(result.valid).toBe(true);
    });

    it('should reject ReadingCreateRequest missing required fields', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(
        schemas.ReadingCreateRequest as Record<string, unknown>,
        {}
      );
      expect(result.valid).toBe(false);
    });

    it('should reject invalid source enum', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(schemas.ReadingCreateRequest as Record<string, unknown>, {
        ...validBody,
        source: 'invalid'
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('Response schema validation', () => {
    it('should validate 201 response as Reading', () => {
      const schema = getResponseSchema(operationId, 201, true);
      expect(schema).not.toBeNull();
      const sample = {
        id: '00000000-0000-0000-0000-000000000001',
        meterId: '00000000-0000-0000-0000-000000000002',
        status: 'valid',
        consumptionValue: null,
        projectThresholdProfile: null
      };
      const result = validateResponseBody(schema!, sample);
      expect(result.valid).toBe(true);
    });

    it('should validate Reading with non-null consumptionValue', () => {
      const schema = getResponseSchema(operationId, 201, true);
      expect(schema).not.toBeNull();
      const sample = {
        id: '00000000-0000-0000-0000-000000000002',
        meterId: '00000000-0000-0000-0000-000000000003',
        status: 'suspicious',
        consumptionValue: 987.65,
        projectThresholdProfile: 'high-consumption'
      };
      const result = validateResponseBody(schema!, sample);
      expect(result.valid).toBe(true);
    });

    it('should validate 422 response as ErrorEnvelope', () => {
      const schema = getResponseSchema(operationId, 422, true);
      expect(schema).not.toBeNull();
      const sample = {
        code: 'VALIDATION_ERROR',
        message: 'readingValue must be a number',
        correlationId: 'test-correlation-id'
      };
      const result = validateResponseBody(schema!, sample);
      expect(result.valid).toBe(true);
    });
  });

  describe('HTTP endpoint (TDD — expected to fail before implementation)', () => {
    const validBody = {
      meterId: '11111111-1111-4111-8111-111111111111',
      projectId: '22222222-2222-4222-8222-222222222222',
      readingValue: 1234.56,
      readingAt: '2026-05-29T12:00:00.000Z',
      source: 'manual'
    };

    it('should return a valid status code for createReading', async () => {
      const res = await request
        .post('/api/v1/readings')
        .set('Authorization', authHeader)
        .send(validBody);
      expect(validateStatus(operationId, res.status)).toBe(true);
    });
  });
});
