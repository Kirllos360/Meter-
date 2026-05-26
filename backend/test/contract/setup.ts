import { readFileSync } from 'fs';
import { resolve } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../../src/common/http/all-exceptions.filter';

let _spec: Record<string, unknown> | null = null;
let _dereferencedSpec: Record<string, unknown> | null = null;
let _ajv: unknown = null;

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

function yamlPath(): string {
  return resolve(
    REPO_ROOT,
    'specs',
    '001-metering-billing-platform',
    'contracts',
    'meter-pulse-api.yaml',
  );
}

export function loadContract(): Record<string, unknown> {
  if (_spec) return _spec;

  const raw = readFileSync(yamlPath(), 'utf-8');
  const yaml = require('js-yaml');
  _spec = yaml.load(raw) as Record<string, unknown>;
  return _spec;
}

export async function loadDereferencedContract(): Promise<Record<string, unknown>> {
  if (_dereferencedSpec) return _dereferencedSpec;

  const $RefParser = require('@apidevtools/json-schema-ref-parser');
  const spec = loadContract();
  _dereferencedSpec = (await $RefParser.dereference(spec as Record<string, unknown>)) as Record<string, unknown>;
  return _dereferencedSpec;
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

export function getResponseSchema(
  operationId: string,
  statusCode: number,
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

      const response = responses[String(statusCode)] as Record<string, unknown> | undefined;
      if (!response) return null;

      const content = response.content as Record<string, unknown> | undefined;
      if (!content) return null;

      const jsonContent = content['application/json'] as Record<string, unknown> | undefined;
      if (!jsonContent) return null;

      return jsonContent.schema as Record<string, unknown> | null;
    }
  }

  return null;
}

export function getDereferencedResponseSchema(
  operationId: string,
  statusCode: number,
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

      const response = responses[String(statusCode)] as Record<string, unknown> | undefined;
      if (!response) return null;

      const schemaRef = extractSchemaRef(response, spec);
      if (!schemaRef) return null;

      const components = spec.components as Record<string, unknown> | undefined;
      if (!components) return null;

      const schemas = components.schemas as Record<string, unknown> | undefined;
      if (!schemas) return null;

      const schemaName = schemaRef.replace('#/components/schemas/', '');
      return schemas[schemaName] as Record<string, unknown> | null;
    }
  }

  return null;
}

function extractSchemaRef(response: Record<string, unknown>, spec: Record<string, unknown>): string | null {
  const resolveSchemaFromContent = (contentBlock: Record<string, unknown>): string | null => {
    const jsonContent = contentBlock['application/json'] as Record<string, unknown> | undefined;
    if (!jsonContent) return null;

    const schema = jsonContent.schema as Record<string, unknown> | undefined;
    if (!schema) return null;

    if (typeof schema.$ref === 'string') {
      return schema.$ref;
    }
    return null;
  };

  const content = response.content as Record<string, unknown> | undefined;
  if (content) {
    const ref = resolveSchemaFromContent(content);
    if (ref) return ref;
  }

  if (typeof response.$ref !== 'string') return null;

  const components = spec.components as Record<string, unknown> | undefined;
  if (!components) return null;

  const compResponses = components.responses as Record<string, unknown> | undefined;
  if (!compResponses) return null;

  const refKey = response.$ref.replace('#/components/responses/', '');
  const resolvedResponse = compResponses[refKey] as Record<string, unknown> | undefined;
  if (!resolvedResponse) return null;

  const resolvedContent = resolvedResponse.content as Record<string, unknown> | undefined;
  if (!resolvedContent) return null;

  return resolveSchemaFromContent(resolvedContent);
}

function getAjv(): unknown {
  if (_ajv) return _ajv;

  const Ajv = require('ajv');
  const addFormats = require('ajv-formats');
  const instance = new Ajv({ strict: false });
  addFormats(instance);
  _ajv = instance;
  return _ajv;
}

export function validateResponseBody(
  schema: Record<string, unknown>,
  body: unknown,
): { valid: boolean; errors: string[] } {
  const ajv = getAjv() as { validate: (schema: Record<string, unknown>, data: unknown) => boolean; errors: Array<{ message?: string; instancePath: string }> | null };
  const valid = ajv.validate(schema, body);
  if (valid) {
    return { valid: true, errors: [] };
  }

  const errorMessages = (ajv.errors ?? []).map(
    (err) => `${err.instancePath} ${err.message ?? 'validation failed'}`.trim(),
  );

  return { valid: false, errors: errorMessages };
}

export async function validateResponseBodyFromContract(
  operationId: string,
  statusCode: number,
  body: unknown,
): Promise<{ valid: boolean; errors: string[] }> {
  const schema = getDereferencedResponseSchema(operationId, statusCode);
  if (!schema) {
    return { valid: false, errors: [`No schema found for ${operationId} ${statusCode}`] };
  }

  return validateResponseBody(schema, body);
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
