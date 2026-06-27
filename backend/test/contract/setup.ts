import { readFileSync } from 'fs';
import { resolve } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../../src/common/http/all-exceptions.filter';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/common/database/prisma.service';

let _spec: Record<string, unknown> | null = null;

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

function yamlPath(): string {
  return resolve(
    REPO_ROOT,
    'specs',
    '001-metering-billing-platform',
    'contracts',
    'meter-pulse-api.yaml'
  );
}

export function loadContract(): Record<string, unknown> {
  if (_spec) return _spec;

  const raw = readFileSync(yamlPath(), 'utf-8');
  const yaml = require('js-yaml');
  _spec = yaml.load(raw) as Record<string, unknown>;
  return _spec;
}

function setAtPath(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

function resolveRef(ref: string, spec: Record<string, unknown>): unknown {
  const parts = ref.replace(/^#\//, '').split('/');
  let current: unknown = spec;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function deepDereference(
  value: unknown,
  spec: Record<string, unknown>,
  visited: Set<string>
): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => deepDereference(v, spec, visited));
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    if (typeof obj.$ref === 'string') {
      if (visited.has(obj.$ref)) {
        return { $ref: obj.$ref };
      }
      visited.add(obj.$ref);
      const resolved = resolveRef(obj.$ref, spec);
      if (resolved !== undefined) {
        const result = deepDereference(resolved, spec, visited);
        visited.delete(obj.$ref);
        return result;
      }
      return obj;
    }

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = deepDereference(val, spec, visited);
    }
    return result;
  }

  return value;
}

export function dereferenceSpec(
  spec: Record<string, unknown>,
  resolveContext?: Record<string, unknown>
): Record<string, unknown> {
  return deepDereference(spec, resolveContext ?? spec, new Set()) as Record<string, unknown>;
}

export function getOperation(
  operationId: string
): { method: string; path: string; operation: Record<string, unknown> } | null {
  const spec = loadContract();
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;

  if (!paths) return null;

  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation || typeof operation !== 'object') continue;
      const op = operation as Record<string, unknown>;
      if (op.operationId === operationId) {
        return { method: method.toUpperCase(), path, operation: op };
      }
    }
  }

  return null;
}

export function getExpectedStatuses(operationId: string): number[] {
  const found = getOperation(operationId);
  if (!found) return [];

  const responses = found.operation.responses as Record<string, unknown> | undefined;
  if (!responses) return [];

  return Object.keys(responses)
    .map((code) => parseInt(code, 10))
    .filter((code) => !isNaN(code));
}

export function getResponseSchema(
  operationId: string,
  statusCode: number,
  dereferenced?: boolean
): Record<string, unknown> | null {
  const spec = loadContract();
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) return null;

  for (const [, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const [, operation] of Object.entries(methods)) {
      if (!operation || typeof operation !== 'object') continue;
      const op = operation as Record<string, unknown>;
      if (op.operationId !== operationId) continue;

      const responses = op.responses as Record<string, unknown> | undefined;
      if (!responses) return null;

      let response = responses[String(statusCode)] as Record<string, unknown> | undefined;
      if (!response) return null;

      if (typeof response.$ref === 'string') {
        const resolved = resolveRef(response.$ref, spec) as Record<string, unknown> | undefined;
        if (!resolved) return null;
        response = resolved;
      }

      const content = response.content as Record<string, unknown> | undefined;
      if (!content) return null;

      const jsonContent = content['application/json'] as Record<string, unknown> | undefined;
      if (!jsonContent) return null;

      let schema = jsonContent.schema as Record<string, unknown> | undefined;
      if (!schema) return null;

      if (typeof schema.$ref === 'string') {
        const resolved = resolveRef(schema.$ref, spec) as Record<string, unknown> | undefined;
        if (!resolved) return null;
        schema = resolved;
      }

      if (dereferenced && schema) {
        return dereferenceSpec(schema, spec) as Record<string, unknown>;
      }

      return schema;
    }
  }

  return null;
}

function getAjv(): unknown {
  const Ajv = require('ajv');
  const addFormats = require('ajv-formats');
  const instance = new Ajv({ strict: false });
  addFormats(instance);
  return instance;
}

export function validateResponseBody(
  schema: Record<string, unknown>,
  body: unknown
): { valid: boolean; errors: string[] } {
  const ajv = getAjv() as {
    validate: (schema: Record<string, unknown>, data: unknown) => boolean;
    errors: Array<{ message?: string; instancePath: string }> | null;
  };
  const valid = ajv.validate(schema, body);
  if (valid) {
    return { valid: true, errors: [] };
  }

  const errorMessages = (ajv.errors ?? []).map((err) =>
    `${err.instancePath} ${err.message ?? 'validation failed'}`.trim()
  );

  return { valid: false, errors: errorMessages };
}

export async function createTestApp(): Promise<{
  app: NestExpressApplication;
  request: ReturnType<typeof import('supertest')>;
  authHeader: string;
}> {
  const supertest = require('supertest');

  // Create mock Prisma delegates
  const mockDelegate = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  });

  const mockPrisma = {
    meter: mockDelegate(),
    meterAssignment: mockDelegate(),
    sIMCard: mockDelegate(),
    sIMAssignment: mockDelegate(),
    customer: mockDelegate(),
    customerUnitAssignment: mockDelegate(),
    project: mockDelegate(),
    projectThreshold: mockDelegate(),
    locationNode: mockDelegate(),
    reading: mockDelegate(),
    auditLog: mockDelegate(),
    user: mockDelegate(),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $on: jest.fn()
  };

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule]
  })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma as unknown as PrismaService)
    .compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();

  const jwtService = app.get(JwtService);
  const token = jwtService.sign({
    sub: 'test-user',
    userId: 'test-user-id',
    role: 'operator'
  });

  return { app, request: supertest(app.getHttpServer()), authHeader: `Bearer ${token}` };
}

export function validateStatus(operationId: string, status: number): boolean {
  const validStatuses = getExpectedStatuses(operationId);
  return validStatuses.length === 0 || validStatuses.includes(status);
}
