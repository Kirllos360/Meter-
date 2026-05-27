import { of, throwError } from 'rxjs';
import { IdempotencyInterceptor } from '../src/common/http/idempotency.interceptor';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let mockPrisma: any;
  let mockContext: any;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockPrisma = {
      idempotencyRecord: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
      },
    };

    interceptor = new IdempotencyInterceptor(mockPrisma);

    mockRequest = {
      method: 'POST',
      path: '/api/v1/test',
      route: { path: '/api/v1/test' },
      headers: {},
      body: { data: 'test' },
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      statusCode: 201,
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    };
  });

  describe('non-mutation methods', () => {
    it('bypasses idempotency check for GET requests', (done) => {
      mockRequest.method = 'GET';
      const next = { handle: () => of({ data: 'ok' }) };

      interceptor.intercept(mockContext, next).subscribe({
        next: (body) => {
          expect(body).toEqual({ data: 'ok' });
          expect(mockPrisma.idempotencyRecord.findUnique).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('bypasses idempotency check for OPTIONS requests', (done) => {
      mockRequest.method = 'OPTIONS';
      const next = { handle: () => of({}) };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          expect(mockPrisma.idempotencyRecord.findUnique).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('mutation methods without Idempotency-Key', () => {
    it('executes normally when no key header is present', (done) => {
      const next = { handle: () => of({ id: 1 }) };

      interceptor.intercept(mockContext, next).subscribe({
        next: (body) => {
          expect(body).toEqual({ id: 1 });
          expect(mockPrisma.idempotencyRecord.findUnique).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('duplicate POST prevention', () => {
    it('caches response on first request', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-123';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);

      const next = { handle: () => of({ id: 1, status: 'created' }) };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          expect(mockPrisma.idempotencyRecord.create).toHaveBeenCalled();
          done();
        },
      });
    });

    it('returns cached response on duplicate request', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-123';
      const cachedBody = { id: 1, status: 'created' };
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue({
        responseStatus: 201,
        responseBody: cachedBody,
      });

      const next = { handle: jest.fn() };

      interceptor.intercept(mockContext, next).subscribe({
        next: (body) => {
          expect(body).toEqual(cachedBody);
          expect(mockResponse.status).toHaveBeenCalledWith(201);
          expect(next.handle).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('response replay', () => {
    it('replays original status code', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-456';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue({
        responseStatus: 409,
        responseBody: { error: 'Conflict' },
      });

      const next = { handle: jest.fn() };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          expect(mockResponse.status).toHaveBeenCalledWith(409);
          done();
        },
      });
    });

    it('replays response body exactly', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-789';
      const expected = { id: 5, status: 'updated' };
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue({
        responseStatus: 200,
        responseBody: expected,
      });

      const next = { handle: jest.fn() };

      interceptor.intercept(mockContext, next).subscribe({
        next: (body) => {
          expect(body).toEqual(expected);
          done();
        },
      });
    });
  });

  describe('scoped key isolation', () => {
    it('isolates keys by actor', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-1';
      mockRequest.user = { id: 'user-a' };
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);

      const next = { handle: () => of({}) };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          const createCall = mockPrisma.idempotencyRecord.create.mock.calls[0][0];
          expect(createCall.data.key).toContain('user-a');
          expect(createCall.data.actor).toBe('user-a');
          done();
        },
      });
    });

    it('isolates keys by route', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-2';
      mockRequest.route = { path: '/api/v1/orders' };
      mockRequest.path = '/api/v1/orders';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);

      const next = { handle: () => of({}) };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          const createCall = mockPrisma.idempotencyRecord.create.mock.calls[0][0];
          expect(createCall.data.key).toContain('/api/v1/orders');
          expect(createCall.data.route).toBe('/api/v1/orders');
          done();
        },
      });
    });

    it('isolates keys by method', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-3';
      mockRequest.method = 'DELETE';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);

      const next = { handle: () => of({}) };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          const createCall = mockPrisma.idempotencyRecord.create.mock.calls[0][0];
          expect(createCall.data.key).toContain('DELETE');
          expect(createCall.data.method).toBe('DELETE');
          done();
        },
      });
    });
  });

  describe('concurrent safety', () => {
    it('replays first-winner response when create hits unique constraint', (done) => {
      mockRequest.headers['idempotency-key'] = 'concurrent-key';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);

      const prismaError = new Error('Unique constraint');
      (prismaError as any).code = 'P2002';
      mockPrisma.idempotencyRecord.create.mockRejectedValue(prismaError);

      const firstResponse = { id: 1, status: 'created-by-first' };
      mockPrisma.idempotencyRecord.findUniqueOrThrow.mockResolvedValue({
        responseStatus: 201,
        responseBody: firstResponse,
      });

      const next = { handle: () => of({ id: 1, status: 'created-by-second' }) };

      interceptor.intercept(mockContext, next).subscribe({
        next: (body) => {
          expect(body).toEqual(firstResponse);
          expect(mockResponse.status).toHaveBeenCalledWith(201);
          expect(mockPrisma.idempotencyRecord.findUniqueOrThrow).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('error handling', () => {
    it('continues request when cache write fails (non-constraint error)', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-write-fail';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);
      mockPrisma.idempotencyRecord.create.mockRejectedValue(new Error('DB error'));

      const next = { handle: () => of({ id: 1 }) };

      interceptor.intercept(mockContext, next).subscribe({
        next: (body) => {
          expect(body).toEqual({ id: 1 });
          done();
        },
      });
    });

    it('continues request when lookup fails', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-lookup-fail';
      mockPrisma.idempotencyRecord.findUnique.mockRejectedValue(new Error('DB error'));

      const next = { handle: () => of({ id: 1 }) };

      interceptor.intercept(mockContext, next).subscribe({
        next: (body) => {
          expect(body).toEqual({ id: 1 });
          done();
        },
      });
    });

    it('propagates handler errors', (done) => {
      mockRequest.headers['idempotency-key'] = 'key-handler-error';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);

      const handlerError = new Error('Handler failed');
      const next = { handle: () => throwError(() => handlerError) };

      interceptor.intercept(mockContext, next).subscribe({
        error: (err) => {
          expect(err).toBe(handlerError);
          done();
        },
      });
    });
  });

  describe('PUT and PATCH methods', () => {
    it('handles PUT requests', (done) => {
      mockRequest.method = 'PUT';
      mockRequest.headers['idempotency-key'] = 'put-key';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);

      const next = { handle: () => of({ updated: true }) };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          expect(mockPrisma.idempotencyRecord.create).toHaveBeenCalled();
          done();
        },
      });
    });

    it('handles PATCH requests', (done) => {
      mockRequest.method = 'PATCH';
      mockRequest.headers['idempotency-key'] = 'patch-key';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);

      const next = { handle: () => of({ patched: true }) };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          expect(mockPrisma.idempotencyRecord.create).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('DELETE method', () => {
    it('caches and replays DELETE responses', (done) => {
      mockRequest.method = 'DELETE';
      mockRequest.headers['idempotency-key'] = 'delete-key';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);

      const next = { handle: () => of({ deleted: true }) };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          expect(mockPrisma.idempotencyRecord.create).toHaveBeenCalled();
          done();
        },
      });
    });

    it('replays cached DELETE response', (done) => {
      mockRequest.method = 'DELETE';
      mockRequest.headers['idempotency-key'] = 'delete-key-replay';
      mockPrisma.idempotencyRecord.findUnique.mockResolvedValue({
        responseStatus: 200,
        responseBody: { deleted: true },
      });

      const next = { handle: jest.fn() };

      interceptor.intercept(mockContext, next).subscribe({
        next: (body) => {
          expect(body).toEqual({ deleted: true });
          expect(next.handle).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
