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

describe('POST /meters/{meterId}/terminate (terminateMeter)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  let prisma: any;
  const operationId = 'terminateMeter';
  const meterId = '11111111-1111-4111-8111-111111111111';

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    request = testApp.request;
    authHeader = testApp.authHeader;

    prisma = app.get(PrismaService);
    prisma.meter.findUnique.mockResolvedValue({
      id: meterId,
      serialNumber: 'TEST-METER-001',
      meterType: 'electricity',
      brand: 'TestBrand',
      model: 'TM-100',
      status: 'available',
      installationDate: new Date(),
      activationDate: new Date(),
      terminationDate: null,
      projectId: '33333333-3333-4333-8333-333333333333',
      locationId: null,
      parentMainMeterId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-id',
      updatedBy: 'test-user-id'
    });
    prisma.meterAssignment.findFirst.mockResolvedValue({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      meterId,
      customerId: 'test-customer-id',
      unitId: 'test-unit-id',
      projectId: 'test-project-id',
      status: 'active',
      startAt: new Date('2026-01-01T00:00:00.000Z'),
      endAt: null,
      changeReason: 'Initial assignment',
      createdBy: 'test-user-id',
      updatedBy: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    prisma.meterAssignment.update.mockResolvedValue({});
    prisma.meter.update.mockResolvedValue({});
    prisma.sIMAssignment.findFirst.mockResolvedValue(null);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Contract definition', () => {
    it('should define terminateMeter operation in the spec', () => {
      const op = getOperation(operationId);
      expect(op).not.toBeNull();
      expect(op!.method).toBe('POST');
      expect(op!.path).toBe('/meters/{meterId}/terminate');
    });

    it('should expect 200 status code', () => {
      const statuses = getExpectedStatuses(operationId);
      expect(statuses).toContain(200);
      expect(statuses).not.toContain(409);
    });

    it('should have MeterTerminateRequest with required fields', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.MeterTerminateRequest as Record<string, unknown>;
      expect(reqSchema).toBeDefined();
      const required = reqSchema.required as string[];
      expect(required).toContain('reason');
      expect(required).toContain('terminatedAt');
      expect(required).toContain('finalReading');
    });

    it('should have MeterTerminateRequest fields with correct types', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.MeterTerminateRequest as Record<string, unknown>;
      const props = reqSchema.properties as Record<string, unknown>;
      expect((props.reason as Record<string, unknown>).type).toBe('string');
      expect((props.terminatedAt as Record<string, unknown>).format).toBe('date-time');
      expect((props.finalReading as Record<string, unknown>).type).toBe('number');
    });

    it('should have MeterTerminateResult schema with 3 properties', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const resultSchema = schemas.MeterTerminateResult as Record<string, unknown>;
      expect(resultSchema).toBeDefined();
      const props = resultSchema.properties as Record<string, unknown>;
      expect((props.meterStatus as Record<string, unknown>).type).toBe('string');
      expect((props.simStatus as Record<string, unknown>).type).toBe('string');
      expect((props.simReusable as Record<string, unknown>).type).toBe('boolean');
    });
  });

  describe('Request schema validation', () => {
    const validBody = {
      reason: 'Meter decommissioned',
      terminatedAt: '2026-05-29T12:00:00.000Z',
      finalReading: 12345.67
    };

    it('should validate a valid MeterTerminateRequest', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(
        schemas.MeterTerminateRequest as Record<string, unknown>,
        validBody
      );
      expect(result.valid).toBe(true);
    });

    it('should accept integer finalReading', () => {
      const body = { ...validBody, finalReading: 10000 };
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(
        schemas.MeterTerminateRequest as Record<string, unknown>,
        body
      );
      expect(result.valid).toBe(true);
    });

    it('should reject MeterTerminateRequest missing required fields', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.MeterTerminateRequest as Record<string, unknown>;
      const result = validateResponseBody(reqSchema, { reason: 'test' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject MeterTerminateRequest with wrong field types', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.MeterTerminateRequest as Record<string, unknown>;
      const result = validateResponseBody(reqSchema, {
        reason: 'test',
        terminatedAt: 'invalid-date',
        finalReading: 'not-a-number'
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('Response schema validation', () => {
    it('should validate 200 response as MeterTerminateResult', () => {
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();
      const sampleResponse = {
        meterStatus: 'terminated',
        simStatus: 'released',
        simReusable: true
      };
      const result = validateResponseBody(schema!, sampleResponse);
      expect(result.valid).toBe(true);
    });

    it('should validate MeterTerminateResult with simReusable false', () => {
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();
      const sampleResponse = {
        meterStatus: 'terminated',
        simStatus: 'cooldown',
        simReusable: false
      };
      const result = validateResponseBody(schema!, sampleResponse);
      expect(result.valid).toBe(true);
    });
  });

  describe('HTTP endpoint (TDD — expected to fail before T033)', () => {
    const validBody = {
      reason: 'Meter decommissioned',
      terminatedAt: '2026-05-29T12:00:00.000Z',
      finalReading: 12345.67
    };

    it('should return a valid status code for terminateMeter', async () => {
      const res = await request
        .post(`/api/v1/meters/${meterId}/terminate`)
        .set('Authorization', authHeader)
        .send(validBody);

      expect(validateStatus(operationId, res.status)).toBe(true);
    });

    it('should return response body matching MeterTerminateResult', async () => {
      const res = await request
        .post(`/api/v1/meters/${meterId}/terminate`)
        .set('Authorization', authHeader)
        .send(validBody);

      expect(res.status).toBe(200);
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();
      const result = validateResponseBody(schema!, res.body);
      expect(result.valid).toBe(true);
    });
  });
});
