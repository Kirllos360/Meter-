import { readFileSync } from 'fs';
import { resolve } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../../src/common/http/all-exceptions.filter';

let _spec: Record<string, unknown> | null = null;

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

export function loadContract(): Record<string, unknown> {
  if (_spec) return _spec;

  const yamlPath = resolve(
    REPO_ROOT,
    'specs',
    '001-metering-billing-platform',
    'contracts',
    'meter-pulse-api.yaml',
  );

  const raw = readFileSync(yamlPath, 'utf-8');
  const yaml = require('js-yaml');
  _spec = yaml.load(raw) as Record<string, unknown>;
  return _spec;
}

export function getOperation(
  operationId: string,
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

export async function createTestApp(): Promise<{
  app: NestExpressApplication;
  req: {
    get: (url: string) => {
      expect: (status: number) => Promise<{ body: Record<string, unknown> }>;
    };
  };
}> {
  const supertest = require('supertest');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();

  const req = supertest(app.getHttpServer());

  return { app, req };
}

export function validateStatus(operationId: string, status: number): boolean {
  const validStatuses = getExpectedStatuses(operationId);
  return validStatuses.length === 0 || validStatuses.includes(status);
}
