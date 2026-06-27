import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createTestApp,
  loadContract,
  dereferenceSpec,
  getResponseSchema,
  validateResponseBody,
  validateStatus
} from './setup';

jest.setTimeout(30000);

describe('API Contract Harness', () => {
  let app: NestExpressApplication;
  let request: any;
  let spec: Record<string, unknown>;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    request = testApp.request;
    spec = loadContract();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Contract loading', () => {
    it('should load and parse the OpenAPI spec from YAML', () => {
      expect(spec).toBeDefined();
      expect(spec.openapi).toBeDefined();
      expect(typeof spec.openapi).toBe('string');
    });

    it('should have a valid API version', () => {
      expect(spec.info).toBeDefined();
      expect((spec.info as Record<string, unknown>).version).toBeDefined();
    });

    it('should reference known operations', () => {
      const paths = spec.paths as Record<string, unknown>;
      expect(paths).toBeDefined();
      expect(Object.keys(paths).length).toBeGreaterThan(0);
    });
  });

  describe('$ref resolution', () => {
    it('should dereference the spec without circular reference issues', () => {
      const dereferenced = dereferenceSpec(spec);
      const json = JSON.stringify(dereferenced);
      expect(json).not.toContain('$ref');
    });

    it('should resolve component schemas', () => {
      const schemas = (spec.components as Record<string, unknown>)?.schemas as Record<
        string,
        unknown
      >;
      expect(schemas).toBeDefined();
      expect(Object.keys(schemas).length).toBeGreaterThan(0);
    });
  });

  describe('Health endpoint', () => {
    const operationId = 'healthCheck';

    it(`should respond with status 200 for ${operationId}`, async () => {
      const res = await request.get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(validateStatus(operationId, res.status)).toBe(true);
    });

    it('should return { status: "ok" }', async () => {
      const res = await request.get('/api/v1/health');
      expect(res.body).toEqual({ status: 'ok' });
    });

    it(`should match the contract schema for ${operationId}`, async () => {
      const schema = getResponseSchema(operationId, 200, true);
      expect(schema).not.toBeNull();

      const res = await request.get('/api/v1/health');
      const result = validateResponseBody(schema!, res.body);
      expect(result.valid).toBe(true);
    });
  });
});
