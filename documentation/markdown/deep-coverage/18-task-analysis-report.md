# Task Analysis Report — T024

## 1. Task ID
**T024** — US1 Contract Tests: `terminateMeter`

## 2. User Story
User Story 1 — Manage Meter and Location Assignments. Write contract-level tests for `POST /meters/{meterId}/terminate` against the OpenAPI spec before any backend implementation exists. TDD: fail first, pass after implementation.

## 3. Dependencies
| Dependency | Status | Relationship |
|---|---|---|
| T012 (Contract Test Harness) | ✅ Complete | `createTestApp()`, `loadContract()`, `getResponseSchema()`, `validateResponseBody()`, `validateStatus()` |
| T023 (assignMeter contract test) | ✅ Complete | Pattern established for meter contract tests |
| T033 (terminateMeter backend) | ❌ Not started | Will implement endpoint to make T024 pass |

## 4. Files
| File | Purpose |
|---|---|
| `backend/test/contract/meter-terminate.contract.spec.ts` | Contract test for terminateMeter |

## 5. Acceptance Criteria
1. Validate `MeterTerminateRequest` schema (required: reason, terminatedAt, finalReading)
2. Validate `MeterTerminateResult` response schema (200)
3. HTTP request to `POST /api/v1/meters/{meterId}/terminate` — fails (404) because endpoint doesn't exist
4. All schema-level assertions pass; HTTP assertions fail (TDD)
5. No existing tests broken
