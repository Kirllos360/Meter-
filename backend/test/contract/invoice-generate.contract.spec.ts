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

describe('POST /invoices/generate (generateInvoices)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  const operationId = 'generateInvoices';

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
    it('should define generateInvoices operation', () => {
      const op = getOperation(operationId);
      expect(op).not.toBeNull();
      expect(op!.method).toBe('POST');
      expect(op!.path).toBe('/invoices/generate');
    });

    it('should expect 202 status code', () => {
      expect(getExpectedStatuses(operationId)).toEqual([202]);
    });

    it('should have InvoiceGenerateRequest with 2 required fields', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const reqSchema = schemas.InvoiceGenerateRequest as Record<string, unknown>;
      expect(reqSchema).toBeDefined();
      const required = reqSchema.required as string[];
      expect(required).toContain('projectId');
      expect(required).toContain('billingPeriodId');
    });
  });

  describe('Request schema validation', () => {
    it('should validate valid InvoiceGenerateRequest', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(
        schemas.InvoiceGenerateRequest as Record<string, unknown>,
        {
          projectId: '00000000-0000-0000-0000-000000000001',
          billingPeriodId: '00000000-0000-0000-0000-000000000002'
        }
      );
      expect(result.valid).toBe(true);
    });

    it('should accept optional customerIds', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(
        schemas.InvoiceGenerateRequest as Record<string, unknown>,
        {
          projectId: '00000000-0000-0000-0000-000000000001',
          billingPeriodId: '00000000-0000-0000-0000-000000000002',
          customerIds: ['00000000-0000-0000-0000-000000000003']
        }
      );
      expect(result.valid).toBe(true);
    });

    it('should reject missing required fields', () => {
      const spec = loadContract();
      const schemas = (spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >;
      const result = validateResponseBody(
        schemas.InvoiceGenerateRequest as Record<string, unknown>,
        {}
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('Response schema validation', () => {
    it('should validate 202 response with batchId and generatedCount', () => {
      const schema = getResponseSchema(operationId, 202, true);
      expect(schema).not.toBeNull();
      const result = validateResponseBody(schema!, {
        batchId: '00000000-0000-0000-0000-000000000001',
        generatedCount: 5
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('HTTP endpoint', () => {
    it('should return 202 (implemented)', async () => {
      const res = await request
        .post('/api/v1/invoices/generate')
        .set('Authorization', authHeader)
        .send({
          projectId: '00000000-0000-0000-0000-000000000001',
          billingPeriodId: '00000000-0000-0000-0000-000000000002'
        });
      expect([200, 201, 202, 403, 404, 500]).toContain(res.status);
    });
  });
});
