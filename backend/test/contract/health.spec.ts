import { loadContract, getOperation, getExpectedStatuses, createTestApp, validateStatus } from './setup';

describe('Contract Harness', () => {
  describe('loadContract', () => {
    it('should load the OpenAPI YAML successfully', () => {
      const spec = loadContract();
      expect(spec).toBeDefined();
      expect(spec).toHaveProperty('openapi');
      expect(spec).toHaveProperty('info');
      expect(spec).toHaveProperty('paths');
    });

    it('should have the correct API title', () => {
      const spec = loadContract();
      const info = spec.info as { title?: string };
      expect(info.title).toBe('Meter Pulse MVP API');
    });

    it('should have a servers array with /api/v1', () => {
      const spec = loadContract();
      const servers = spec.servers as Array<{ url: string }>;
      expect(servers).toBeDefined();
      expect(servers[0].url).toBe('/api/v1');
    });

    it('should define known paths', () => {
      const spec = loadContract();
      const paths = spec.paths as Record<string, unknown>;
      expect(paths).toHaveProperty('/meters/{meterId}/assign');
      expect(paths).toHaveProperty('/readings');
      expect(paths).toHaveProperty('/invoices/generate');
    });
  });

  describe('getOperation', () => {
    it('should find an operation by operationId', () => {
      const result = getOperation('assignMeter');
      expect(result).not.toBeNull();
      expect(result!.method).toBe('POST');
      expect(result!.path).toBe('/meters/{meterId}/assign');
    });

    it('should return null for unknown operationId', () => {
      const result = getOperation('nonExistent');
      expect(result).toBeNull();
    });
  });

  describe('getExpectedStatuses', () => {
    it('should return expected status codes for assignMeter', () => {
      const statuses = getExpectedStatuses('assignMeter');
      expect(statuses).toContain(200);
    });
  });

  describe('createTestApp', () => {
    it('should bootstrap the NestJS app and call health endpoint', async () => {
      const { app, req } = await createTestApp();

      const res = await req.get('/api/v1/health').expect(200);
      expect(res.body).toEqual({ status: 'ok' });

      await app.close();
    });
  });

  describe('validateStatus', () => {
    it('should validate that 200 is valid for assignMeter', () => {
      expect(validateStatus('assignMeter', 200)).toBe(true);
    });

    it('should return true for unknown operationIds', () => {
      expect(validateStatus('unknownOp', 200)).toBe(true);
    });
  });
});
