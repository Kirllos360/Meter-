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

describe('POST /meters/{meterId}/assign (assignMeter)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  let prisma: any;
  const operationId = 'assignMeter';
  const meterId = '11111111-1111-4111-8111-111111111111';
  const testCustomerId = '11111111-1111-4111-8111-111111111111';
  const testUnitId = '22222222-2222-4222-8222-222222222222';
  const testProjectId = '33333333-3333-4333-8333-333333333333';
  const testStartAt = '2026-05-29T00:00:00.000Z';

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
      projectId: testProjectId,
      locationId: null,
      parentMainMeterId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-id',
      updatedBy: 'test-user-id'
    });
    prisma.meterAssignment.create.mockResolvedValue({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      meterId,
      customerId: testCustomerId,
      unitId: testUnitId,
      projectId: testProjectId,
      startAt: new Date(testStartAt),
      endAt: null,
      changeReason: 'Meter assignment',
      status: 'active',
      createdBy: 'test-user-id',
      updatedBy: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    prisma.meterAssignment.findFirst.mockResolvedValue(null);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe('Contract definition', () => {
    it('should define assignMeter operation in the spec', () => {
      const op = getOperation(operationId);
      expect(op).not.toBeNull();
      expect(op!.method).toBe('POST');
      expect(op!.path).toBe('/meters/{meterId}/assign');
    });

    it('should expect 200 and 409 status codes', () => {
      const statuses = getExpectedStatuses(operationId);
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);
    });

    it('should have MeterAssignRequest with required fields', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.MeterAssignRequest as Record<string, unknown>;
      expect(reqSchema).toBeDefined();
      const required = reqSchema.required as string[];
      expect(required).toContain('customerId');
      expect(required).toContain('unitId');
      expect(required).toContain('projectId');
      expect(required).toContain('startAt');
    });

    it('should have MeterAssignRequest fields with correct types', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.MeterAssignRequest as Record<string, unknown>;
      const props = reqSchema.properties as Record<string, unknown>;
      expect((props.customerId as Record<string, unknown>).type).toBe('string');
      expect((props.customerId as Record<string, unknown>).format).toBe('uuid');
      expect((props.unitId as Record<string, unknown>).format).toBe('uuid');
      expect((props.projectId as Record<string, unknown>).format).toBe('uuid');
      expect((props.startAt as Record<string, unknown>).format).toBe('date-time');
    });

    it('should have MeterAssignment schema with nullable endAt', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const assignmentSchema = schemas.MeterAssignment as Record<string, unknown>;
      expect(assignmentSchema).toBeDefined();
      const props = assignmentSchema.properties as Record<string, unknown>;
      expect((props.id as Record<string, unknown>).format).toBe('uuid');
      expect((props.meterId as Record<string, unknown>).format).toBe('uuid');
      expect((props.endAt as Record<string, unknown>).nullable).toBe(true);
    });

    it('should have ConflictError response referencing ErrorEnvelope', () => {
      const spec = loadContract();
      const responses = (spec.components as Record<string, unknown>).responses as Record<
        string,
        unknown
      >;
      expect(responses.ConflictError).toBeDefined();
      const conflictSchema = getResponseSchema(operationId, 409);
      expect(conflictSchema).not.toBeNull();
    });
  });

  describe('Request schema validation', () => {
    const validBody = {
      customerId: '00000000-0000-0000-0000-000000000001',
      unitId: '00000000-0000-0000-0000-000000000002',
      projectId: '00000000-0000-0000-0000-000000000003',
      startAt: '2026-05-29T00:00:00.000Z'
    };

    it('should validate a valid MeterAssignRequest', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(
        schemas.MeterAssignRequest as Record<string, unknown>,
        validBody
      );
      expect(result.valid).toBe(true);
    });

    it('should accept optional reason field in MeterAssignRequest', () => {
      const bodyWithReason = {
        ...validBody,
        reason: 'New tenant moving in'
      };
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(
        schemas.MeterAssignRequest as Record<string, unknown>,
        bodyWithReason
      );
      expect(result.valid).toBe(true);
    });

    it('should reject MeterAssignRequest missing required fields', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.MeterAssignRequest as Record<string, unknown>;
      const result = validateResponseBody(reqSchema, { customerId: 'test' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject MeterAssignRequest with wrong field types', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.MeterAssignRequest as Record<string, unknown>;
      const result = validateResponseBody(reqSchema, {
        customerId: 'not-a-uuid',
        unitId: 'not-a-uuid',
        projectId: 'not-a-uuid',
        startAt: 'invalid-date'
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('Response schema validation', () => {
    it('should validate 200 response as MeterAssignment', () => {
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();
      const sampleResponse = {
        id: '00000000-0000-0000-0000-000000000001',
        meterId,
        customerId: '00000000-0000-0000-0000-000000000002',
        unitId: '00000000-0000-0000-0000-000000000003',
        status: 'active',
        startAt: '2026-05-29T00:00:00.000Z',
        endAt: null
      };
      const result = validateResponseBody(schema!, sampleResponse);
      expect(result.valid).toBe(true);
    });

    it('should validate 409 response as ErrorEnvelope', () => {
      const schema = getResponseSchema(operationId, 409, true);
      expect(schema).not.toBeNull();
      const sampleError = {
        code: 'METER_ALREADY_ASSIGNED',
        message: 'Meter is already assigned to a customer',
        correlationId: 'test-correlation-id',
        details: { meterId }
      };
      const result = validateResponseBody(schema!, sampleError);
      expect(result.valid).toBe(true);
    });

    it('should validate 409 response without optional details', () => {
      const schema = getResponseSchema(operationId, 409, true);
      expect(schema).not.toBeNull();
      const minimalError = {
        code: 'METER_ALREADY_ASSIGNED',
        message: 'Meter is already assigned',
        correlationId: 'test-correlation-id'
      };
      const result = validateResponseBody(schema!, minimalError);
      expect(result.valid).toBe(true);
    });
  });

  describe('HTTP endpoint (TDD — expected to fail before T031)', () => {
    const validBody = {
      customerId: testCustomerId,
      unitId: testUnitId,
      projectId: testProjectId,
      startAt: testStartAt
    };

    it('should return a valid status code for assignMeter', async () => {
      const res = await request
        .post(`/api/v1/meters/${meterId}/assign`)
        .set('Authorization', authHeader)
        .send(validBody);

      expect(validateStatus(operationId, res.status)).toBe(true);
    });

    it('should return response body matching MeterAssignment or ErrorEnvelope', async () => {
      const res = await request
        .post(`/api/v1/meters/${meterId}/assign`)
        .set('Authorization', authHeader)
        .send(validBody);

      const schema = getResponseSchema(operationId, res.status as 200 | 409, true);
      if (schema) {
        const result = validateResponseBody(schema, res.body);
        expect(result.valid).toBe(true);
      }
    });

    it('should return 409 ConflictError when meter is already assigned', async () => {
      prisma.meterAssignment.findFirst.mockResolvedValueOnce({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        meterId,
        customerId: testCustomerId,
        unitId: testUnitId,
        projectId: testProjectId,
        status: 'active',
        startAt: new Date('2026-01-01T00:00:00.000Z'),
        endAt: null
      });

      const res = await request
        .post(`/api/v1/meters/${meterId}/assign`)
        .set('Authorization', authHeader)
        .send(validBody);

      expect(res.status).toBe(409);
      const schema = getResponseSchema(operationId, 409, true);
      expect(schema).not.toBeNull();
      const result = validateResponseBody(schema!, res.body);
      expect(result.valid).toBe(true);
    });
  });
});
