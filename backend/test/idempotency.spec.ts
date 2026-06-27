import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from '../src/idempotency/idempotency.service';
import { IdempotencyInterceptor } from '../src/idempotency/idempotency.interceptor';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [IdempotencyService]
    }).compile();
    service = module.get<IdempotencyService>(IdempotencyService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create and retrieve a record by key', async () => {
    const key = 'test-user:POST:/api/test:key-1';
    await service.createRecord(key, 'POST', '/api/test', 'test-user');
    const found = await service.findByKey(key);
    expect(found).not.toBeNull();
    expect(found!.scopedKey).toBe(key);
  });

  it('should return null for unknown key', async () => {
    const found = await service.findByKey('nonexistent');
    expect(found).toBeNull();
  });

  it('should set and retrieve response data', async () => {
    const key = 'test-user:POST:/api/test:key-2';
    await service.createRecord(key, 'POST', '/api/test', 'test-user');
    await service.setResponse(key, { result: 'ok' }, 201);
    const found = await service.findByKey(key);
    expect(found!.responseBody).toEqual({ result: 'ok' });
    expect(found!.responseStatus).toBe(201);
  });
});

describe('IdempotencyInterceptor', () => {
  it('should be defined', () => {
    const mockService = {} as IdempotencyService;
    const interceptor = new IdempotencyInterceptor(mockService);
    expect(interceptor).toBeDefined();
  });
});
