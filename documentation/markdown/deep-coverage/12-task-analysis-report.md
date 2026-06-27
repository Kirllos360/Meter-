# Task Analysis Report — T023

## 1. Task ID
**T023** — US1 Contract Tests: `assignMeter`

## 2. User Story
User Story 1 — Manage Meter and Location Assignments. Write contract-level tests that validate `POST /meters/{meterId}/assign` against the OpenAPI spec before any backend implementation exists. Tests must demonstrate TDD: fail first, pass after T031 implementation.

## 3. Dependencies
| Dependency | Status | Relationship |
|---|---|---|
| T012 (Contract Test Harness) | ✅ Complete | Provides `createTestApp()`, `loadContract()`, `getResponseSchema()`, `validateResponseBody()`, `validateStatus()` |
| T006 (ErrorEnvelope) | ✅ Complete | 409 ConflictError returns ErrorEnvelope — referenced in contract validation |
| T011 (API versioning /api/v1) | ✅ Complete | Endpoint lives under `/api/v1/meters/{meterId}/assign` |
| T031 (Backend: assignMeter) | ❌ Not started | Will implement the endpoint to make T023 pass |
| T032 (Backend: assignMeter conflict) | ❌ Not started | Will implement 409 ConflictError to make T023 pass |

## 4. Files

### Created
| File | Purpose |
|---|---|
| `backend/test/contract/meter-assign.contract.spec.ts` | Contract test for assignMeter operation |
| `documentation/markdown/deep-coverage/12-task-analysis-report.md` | This report |
| `documentation/markdown/deep-coverage/13-acceptance-coverage-matrix.md` | Acceptance matrix |
| `documentation/markdown/deep-coverage/14-file-impact-analysis.md` | File impact |
| `documentation/markdown/deep-coverage/15-dependency-matrix.md` | Dependency matrix |
| `documentation/markdown/deep-coverage/16-risk-mitigation-report.md` | Risk mitigation |
| `documentation/markdown/deep-coverage/17-hidden-requirement-report.md` | Hidden requirements |

### No modifications to existing files
T023 is pure test creation — no existing files are modified.

## 5. Acceptance Criteria
1. Contract test validates `MeterAssignRequest` schema (required: customerId, unitId, projectId, startAt)
2. Contract test validates `MeterAssignment` response schema (200)
3. Contract test validates `ConflictError` → `ErrorEnvelope` response schema (409)
4. Contract test makes HTTP request to `POST /api/v1/meters/{meterId}/assign` — fails (404) because endpoint doesn't exist
5. Test execution shows expected failures (TDD proof)
6. All schema-level assertions pass (spec validation is independent of implementation)
7. No existing tests broken

## 6. Spec Coverage
| Spec Section | Endpoint | Coverage |
|---|---|---|
| `paths./meters/{meterId}/assign.post` | `POST /api/v1/meters/{meterId}/assign` | Request body, 200 response, 409 response |
| `components.schemas.MeterAssignRequest` | — | Required fields, property types (uuid, date-time) |
| `components.schemas.MeterAssignment` | — | Response shape, nullable endAt |
| `components.schemas.ErrorEnvelope` | — | 409 ConflictError envelope |
| `components.responses.ConflictError` | — | $ref resolution to ErrorEnvelope |
