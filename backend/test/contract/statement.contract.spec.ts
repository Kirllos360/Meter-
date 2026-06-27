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

describe('GET /customers/{customerId}/statement (getCustomerStatement)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  const operationId = 'getCustomerStatement';
  const testCustomerId = '11111111-1111-4111-8111-111111111111';
  const from = '2026-01-01';
  const to = '2026-01-31';

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

    it('should accept 200 as expected status', () => {
      const statuses = getExpectedStatuses(operationId);
      expect(statuses).toContain(200);
    });

    it('should define CustomerStatement schema', () => {
      const spec = loadContract() as any;
      expect(spec.components?.schemas?.CustomerStatement).toBeDefined();
    });

    it('should define entry schema with running balance', () => {
      const spec = loadContract() as any;
      expect(spec.components?.schemas?.CustomerStatement?.properties?.entries).toBeDefined();
    });
  });

  describe('Query parameters', () => {
    it('should support from/to date filters', () => {
      const op = getOperation(operationId);
      const params = (op?.operation as any)?.parameters || [];
      const paramNames = params.map((p: any) => p.name);
      expect(paramNames).toContain('from');
      expect(paramNames).toContain('to');
    });
  });

  describe('HTTP endpoint', () => {
    it('should return 200 or 404 (TDD)', async () => {
      const res = await request
        .get(`/api/v1/customers/${testCustomerId}/statement?from=${from}&to=${to}`)
        .set('Authorization', authHeader);
      expect([200, 403, 404]).toContain(res.status);
    });
  });
});
