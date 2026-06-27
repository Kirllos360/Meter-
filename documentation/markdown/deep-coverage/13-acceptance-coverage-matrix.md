# Acceptance Coverage Matrix — T023

| # | Acceptance Criterion | Implementation Location | Files Changed | Validation Method | Test Method | Evidence | Status |
|---|---|---|---|---|---|---|---|
| AC1 | Contract test validates MeterAssignRequest schema | `meter-assign.contract.spec.ts` | 1 | Schema assertion | `validateResponseBody(schema, validBody)` | All required fields (customerId, unitId, projectId, startAt) present | ❌ TDD PENDING |
| AC2 | Contract test validates MeterAssignment response schema (200) | `meter-assign.contract.spec.ts` | 1 | Schema assertion | `validateResponseBody(schema, sampleResponse)` | MeterAssignment shape with id, meterId, customerId, unitId, status, startAt, endAt | ❌ TDD PENDING |
| AC3 | Contract test validates ConflictError → ErrorEnvelope (409) | `meter-assign.contract.spec.ts` | 1 | Schema assertion | `validateResponseBody(schema, sampleError)` | ErrorEnvelope with code, message, correlationId, details | ❌ TDD PENDING |
| AC4 | HTTP request to POST endpoint fails with 404 | `meter-assign.contract.spec.ts` | 1 | HTTP request | `request.post('/api/v1/meters/{id}/assign')` | Expect non-200/non-409 response (endpoint missing) | ❌ TDD EXPECTED FAIL |
| AC5 | Schema-level assertions pass (spec valid) | `meter-assign.contract.spec.ts` | 1 | Static validation | `validateResponseBody(schema, data)` | All schema tests pass (true → true) | ✅ EXPECTED PASS |
| AC6 | No existing tests broken | `backend/` | 0 | Test suite | `npm test` | Pre-existing tests continue passing | ✅ EXPECTED PASS |

**Coverage: 6/6 = 100%** (TDD: 4 will fail until T031/T032)
