# Acceptance Coverage Matrix — T024

| # | Criterion | Location | Validation | Status |
|---|---|---|---|---|
| AC1 | MeterTerminateRequest schema (required: reason, terminatedAt, finalReading) | `meter-terminate.contract.spec.ts` | `validateResponseBody(schema, validBody)` | ❌ TDD PENDING |
| AC2 | MeterTerminateResult response schema (200) | `meter-terminate.contract.spec.ts` | `validateResponseBody(schema, sampleResponse)` | ❌ TDD PENDING |
| AC3 | HTTP request fails with 404 (no endpoint) | `meter-terminate.contract.spec.ts` | `request.post('/api/v1/meters/{id}/terminate')` | ❌ TDD EXPECTED FAIL |
| AC4 | Schema-level assertions pass | `meter-terminate.contract.spec.ts` | Static validation | ✅ EXPECTED PASS |
| AC5 | No existing tests broken | `backend/` | `npm test` | ✅ EXPECTED PASS |

**Coverage: 5/5 = 100%**
