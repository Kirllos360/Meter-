# T012 Validation Report — Contract-Test Harness

**Date**: 2026-05-26
**Branch**: `feature/t012-contract-harness`
**Commit**: `79d9620`

## Summary

Built contract-test harness against `meter-pulse-api.yaml` in `backend/test/contract/`.

## Files Changed

- `backend/test/contract/setup.ts` — Contract-test harness with YAML loading, operation lookup, schema validation, and NestJS bootstrap
- `backend/test/contract/health.spec.ts` — 26 tests covering all harness functions
- `backend/package.json` — Added devDependencies
- `backend/package-lock.json` — Lock file update

## Dependencies Added

- `supertest`, `@types/supertest` — HTTP integration testing
- `js-yaml`, `@types/js-yaml` — YAML parsing
- `ajv`, `ajv-formats` — JSON Schema validation
- `@apidevtools/json-schema-ref-parser` — OpenAPI $ref resolution

## Test Results

```
PASS test/contract/health.spec.ts
  Contract Harness
    loadContract
      ✓ should load the OpenAPI YAML successfully
      ✓ should have the correct API title
      ✓ should have a servers array with /api/v1
      ✓ should define known paths
      ✓ should define components.schemas with known types
    getOperation
      ✓ should find an operation by operationId
      ✓ should find generateInvoices operation
      ✓ should return null for unknown operationId
    getExpectedStatuses
      ✓ should return expected status codes for assignMeter
      ✓ should return expected status codes for generateInvoice
    getResponseSchema
      ✓ should return a schema object for assignMeter 200
      ✓ should return null for an unknown status code
      ✓ should return null for an unknown operationId
    getDereferencedResponseSchema
      ✓ should resolve $ref to the actual schema for assignMeter 200
      ✓ should resolve ErrorEnvelope for assignMeter 409
      ✓ should return null for an unknown operationId
    validateResponseBody
      ✓ should validate a valid ErrorEnvelope body
      ✓ should reject an invalid ErrorEnvelope body
      ✓ should validate an empty object against MeterAssignment
    validateResponseBodyFromContract
      ✓ should validate against assignMeter 409 ErrorEnvelope
      ✓ should fail validation for invalid error body
      ✓ should return error for unknown operationId
    createTestApp
      ✓ should bootstrap the NestJS app and call health endpoint
    validateStatus
      ✓ should validate that 200 is valid for assignMeter
      ✓ should return false for invalid status 418
      ✓ should return true for unknown operationIds

Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
```

## Build Results

- `npm run build` — Clean
- `npx eslint src/**/*.ts` — Clean

## Acceptance Criteria

| Criterion | Status |
|-----------|--------|
| Harness validates responses against meter-pulse-api.yaml | ✅ |
| One smoke assertion passes | ✅ (health endpoint) |
| YAML path stable from repo root | ✅ (repo-root anchor) |
| Jest discovers and executes contract tests | ✅ |
| Backend build succeeds | ✅ |
