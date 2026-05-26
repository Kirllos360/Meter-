import {
  loadContract,
  getOperation,
  getExpectedStatuses,
  createTestApp,
  validateStatus,
  getResponseSchema,
  getDereferencedResponseSchema,
  validateResponseBody,
  validateResponseBodyFromContract,
} from './setup';

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

    it('should define components.schemas with known types', () => {
      const spec = loadContract();
      const components = spec.components as Record<string, unknown>;
      const schemas = components.schemas as Record<string, unknown>;
      expect(schemas).toHaveProperty('ErrorEnvelope');
      expect(schemas).toHaveProperty('MeterAssignment');
      expect(schemas).toHaveProperty('Reading');
    });
  });

  describe('getOperation', () => {
    it('should find an operation by operationId', () => {
      const result = getOperation('assignMeter');
      expect(result).not.toBeNull();
      expect(result!.method).toBe('POST');
      expect(result!.path).toBe('/meters/{meterId}/assign');
    });

    it('should find generateInvoices operation', () => {
      const result = getOperation('generateInvoices');
      expect(result).not.toBeNull();
      expect(result!.method).toBe('POST');
      expect(result!.path).toBe('/invoices/generate');
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

    it('should return expected status codes for generateInvoice', () => {
      const statuses = getExpectedStatuses('generateInvoices');
      expect(statuses).toContain(202);
    });
  });

  describe('getResponseSchema', () => {
    it('should return a schema object for assignMeter 200', () => {
      const schema = getResponseSchema('assignMeter', 200);
      expect(schema).not.toBeNull();
      expect(schema!.$ref).toBe('#/components/schemas/MeterAssignment');
    });

    it('should return null for an unknown status code', () => {
      const schema = getResponseSchema('assignMeter', 999);
      expect(schema).toBeNull();
    });

    it('should return null for an unknown operationId', () => {
      const schema = getResponseSchema('nonExistent', 200);
      expect(schema).toBeNull();
    });
  });

  describe('getDereferencedResponseSchema', () => {
    it('should resolve $ref to the actual schema for assignMeter 200', () => {
      const schema = getDereferencedResponseSchema('assignMeter', 200);
      expect(schema).not.toBeNull();
      expect(schema!.type).toBe('object');
    });

    it('should resolve ErrorEnvelope for assignMeter 409', () => {
      const schema = getDereferencedResponseSchema('assignMeter', 409);
      expect(schema).not.toBeNull();
      expect(schema!.type).toBe('object');
    });

    it('should return null for an unknown operationId', () => {
      const schema = getDereferencedResponseSchema('other', 200);
      expect(schema).toBeNull();
    });
  });

  describe('validateResponseBody', () => {
    it('should validate a valid ErrorEnvelope body', () => {
      const schema = getDereferencedResponseSchema('assignMeter', 409);
      expect(schema).not.toBeNull();

      const result = validateResponseBody(schema!, {
        code: 'CONFLICT',
        message: 'Meter already assigned',
        correlationId: 'abc-123',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject an invalid ErrorEnvelope body (missing required fields)', () => {
      const schema = getDereferencedResponseSchema('assignMeter', 409);
      expect(schema).not.toBeNull();

      const result = validateResponseBody(schema!, {
        code: 'CONFLICT',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate an empty object against MeterAssignment (all optional)', () => {
      const schema = getDereferencedResponseSchema('assignMeter', 200);
      expect(schema).not.toBeNull();

      const result = validateResponseBody(schema!, {});
      expect(result.valid).toBe(true);
    });
  });

  describe('validateResponseBodyFromContract', () => {
    it('should validate against assignMeter 409 ErrorEnvelope', async () => {
      const result = await validateResponseBodyFromContract('assignMeter', 409, {
        code: 'CONFLICT',
        message: 'Duplicate',
        correlationId: 'xyz',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail validation for invalid error body', async () => {
      const result = await validateResponseBodyFromContract('assignMeter', 409, {
        code: 'CONFLICT',
      });
      expect(result.valid).toBe(false);
    });

    it('should return error for unknown operationId', async () => {
      const result = await validateResponseBodyFromContract('unknown', 200, {});
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('No schema found');
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

    it('should return false for invalid status 418 for assignMeter', () => {
      expect(validateStatus('assignMeter', 418)).toBe(false);
    });

    it('should return true for unknown operationIds', () => {
      expect(validateStatus('unknownOp', 200)).toBe(true);
    });
  });
});
