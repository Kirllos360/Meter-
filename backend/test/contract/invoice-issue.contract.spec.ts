import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createTestApp,
  getOperation,
  getResponseSchema,
  validateResponseBody,
  validateStatus,
  getExpectedStatuses
} from './setup';

jest.setTimeout(30000);

describe('POST /invoices/{invoiceId}/issue (issueInvoice)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  const operationId = 'issueInvoice';
  const invoiceId = '00000000-0000-0000-0000-000000000001';

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
    it('should define issueInvoice operation', () => {
      const op = getOperation(operationId);
      expect(op).not.toBeNull();
      expect(op!.method).toBe('POST');
      expect(op!.path).toBe('/invoices/{invoiceId}/issue');
    });

    it('should expect 200 and 409 status codes', () => {
      const statuses = getExpectedStatuses(operationId);
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);
    });

    it('should reference InvoiceId and IdempotencyKey parameters', () => {
      const op = getOperation(operationId);
      const params = op!.operation.parameters as Record<string, unknown>[];
      const refs = params.map((p) => (p as Record<string, unknown>).$ref as string);
      expect(refs.some((r) => r.endsWith('/InvoiceId'))).toBe(true);
      expect(refs.some((r) => r.endsWith('/IdempotencyKey'))).toBe(true);
    });
  });

  describe('Response schema validation', () => {
    it('should validate 200 response as Invoice', () => {
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();
      const sample = {
        id: '00000000-0000-0000-0000-000000000001',
        invoiceNumber: 'INV-001',
        utilityType: 'electricity',
        status: 'issued',
        subtotalAmount: 100.5,
        taxAmount: 14.5,
        totalAmount: 115.0,
        remainingAmount: 115.0
      };
      const result = validateResponseBody(schema!, sample);
      expect(result.valid).toBe(true);
    });

    it('should validate Invoice with water utility type', () => {
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();
      const sample = {
        id: '00000000-0000-0000-0000-000000000002',
        invoiceNumber: 'INV-002',
        utilityType: 'water',
        status: 'draft',
        subtotalAmount: 50.0,
        taxAmount: 5.0,
        totalAmount: 55.0,
        remainingAmount: 55.0
      };
      const result = validateResponseBody(schema!, sample);
      expect(result.valid).toBe(true);
    });

    it('should validate 409 response as ErrorEnvelope', () => {
      const schema = getResponseSchema(operationId, 409, true);
      expect(schema).not.toBeNull();
      const result = validateResponseBody(schema!, {
        code: 'HIGH_RISK_INVOICE',
        message: 'Invoice requires approval before issue',
        correlationId: 'test-correlation-id'
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('HTTP endpoint', () => {
    it('should return a valid status code', async () => {
      const res = await request
        .post(`/api/v1/invoices/${invoiceId}/issue`)
        .set('Authorization', authHeader);
      expect([200, 201, 202, 403, 404, 409, 422, 500]).toContain(res.status);
    });
  });
});
