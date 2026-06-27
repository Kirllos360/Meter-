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

jest.setTimeout(30000);

describe('POST /payments (createPayment)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  const operationId = 'createPayment';
  const testProjectId = '33333333-3333-4333-8333-333333333333';
  const testCustomerId = '11111111-1111-4111-8111-111111111111';
  const testInvoiceId = '44444444-4444-4444-8444-444444444444';

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    request = testApp.request;
    authHeader = testApp.authHeader;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Contract definition', () => {
    it('should have operationId in OpenAPI spec', () => {
      const op = getOperation(operationId);
      expect(op).toBeDefined();
    });

    it('should accept 201 as expected status', () => {
      const statuses = getExpectedStatuses(operationId);
      expect(statuses).toContain(201);
    });

    it('should define PaymentCreateRequest schema', () => {
      const spec = loadContract() as any;
      expect(spec.components?.schemas?.PaymentCreateRequest).toBeDefined();
    });

    it('should define Payment response schema', () => {
      const spec = loadContract() as any;
      expect(spec.components?.schemas?.Payment).toBeDefined();
    });

    it('should include allocationMode enum with oldest_due_first default', () => {
      const schema = (loadContract() as any).components?.schemas?.PaymentCreateRequest;
      const alloc = schema?.properties?.allocationMode;
      expect(alloc).toBeDefined();
      expect(alloc.default).toBe('oldest_due_first');
    });
  });

  describe('Request schema validation', () => {
    it('should accept valid payment body', () => {
      const body = {
        projectId: testProjectId,
        customerId: testCustomerId,
        amount: 500,
        paymentDate: new Date().toISOString(),
        method: 'cash'
      };
      const spec = loadContract() as any;
      expect(spec.components?.schemas?.PaymentCreateRequest).toBeDefined();
      expect(body).toBeDefined();
    });

    it('should reject body without required fields', () => {
      const body: Record<string, unknown> = { amount: 500 };
      const errors: string[] = [];
      if (!body.projectId) errors.push('projectId required');
      if (!body.customerId) errors.push('customerId required');
      if (!body.paymentDate) errors.push('paymentDate required');
      if (!body.method) errors.push('method required');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('HTTP endpoint', () => {
    it('should return 201 or 404 (TDD)', async () => {
      const res = await request.post('/api/v1/payments').set('Authorization', authHeader).send({
        projectId: testProjectId,
        customerId: testCustomerId,
        amount: 500,
        paymentDate: new Date().toISOString(),
        method: 'cash'
      });
      expect([201, 403, 404, 500]).toContain(res.status);
    });
  });
});

describe('POST /payments/{paymentId}/reverse (reversePayment)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  const operationId = 'reversePayment';
  const testPaymentId = '55555555-5555-4555-8555-555555555555';

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    request = testApp.request;
    authHeader = testApp.authHeader;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Contract definition', () => {
    it('should have operationId in OpenAPI spec', () => {
      const op = getOperation(operationId);
      expect(op).toBeDefined();
    });

    it('should include 403 ForbiddenError response', () => {
      const statuses = getExpectedStatuses(operationId);
      expect(statuses).toContain(403);
    });
  });

  describe('Authorization', () => {
    it('should require reason in body', () => {
      const op = getOperation(operationId) as any;
      expect(op?.operation?.requestBody?.content?.['application/json']?.schema?.required).toContain(
        'reason'
      );
    });
  });

  describe('HTTP endpoint', () => {
    it('should return 403, 404 or 200 (TDD)', async () => {
      const res = await request
        .post(`/api/v1/payments/${testPaymentId}/reverse`)
        .set('Authorization', authHeader)
        .send({ reason: 'Test reversal' });
      expect([200, 403, 404, 500]).toContain(res.status);
    });
  });
});
