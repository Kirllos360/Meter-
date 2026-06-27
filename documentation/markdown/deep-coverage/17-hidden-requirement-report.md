# Hidden Requirements Report — T023

## Requirement Audit

| # | Requirement | Source | Explicit in Spec? | Gap | Action |
|---|---|---|---|---|---|
| HR1 | MeterAssignRequest requires customerId | YAML schemas | ✅ Yes — `required: [customerId, unitId, projectId, startAt]` | None | Covered in test |
| HR2 | MeterAssignRequest requires unitId | YAML schemas | ✅ Yes | None | Covered |
| HR3 | MeterAssignRequest requires projectId | YAML schemas | ✅ Yes | None | Covered |
| HR4 | MeterAssignRequest requires startAt | YAML schemas | ✅ Yes | None | Covered |
| HR5 | reason field is optional in MeterAssignRequest | YAML schemas | ✅ Yes — not in required array | None | Test should NOT require reason |
| HR6 | MeterAssignment includes nullable endAt | YAML schemas | ✅ Yes — `nullable: true` | None | Sample response must pass `null` for endAt |
| HR7 | 409 ConflictError returns ErrorEnvelope | YAML responses | ✅ Yes — `$ref: '#/components/responses/ConflictError'` | None | Validate via $ref resolution |
| HR8 | Idempotency-Key header is optional | YAML parameters | ✅ Yes — no `required` field; `required: false` | None | Not required in test body |
| HR9 | MeterAssignRequest fields use uuid format | YAML schemas | ✅ Yes — `format: uuid` for customerId, unitId, projectId | None | Test values must be valid UUIDs |
| HR10 | startAt uses date-time format | YAML schemas | ✅ Yes — `format: date-time` | None | Test value must be ISO 8601 |
| HR11 | 200 response returns MeterAssignment with all fields | YAML schemas | ✅ Yes | None | Sample must include all properties |
| HR12 | ErrorEnvelope requires code, message, correlationId | YAML schemas | ✅ Yes — `required: [code, message, correlationId]` | None | Sample error must have all required fields |
| HR13 | ErrorEnvelope details is optional | YAML schemas | ✅ — not in required array | None | Test should accept missing details |
| HR14 | Endpoint must not exist before T031 | Phase 3 plan | ✅ — backend/src/meters/ is empty | None | Verified by git status |

## Implicit Assumptions
| # | Assumption | Validation |
|---|---|---|
| IA1 | HTTP 404 for unknown routes in NestJS | Verified by T012 harness — NestJS returns 404 JSON body |
| IA2 | supertest resolves `request.post()` without throwing | Verified by T012 pattern |
| IA3 | AJV validates uuid format strings correctly | `ajv-formats` plugin enables format validation |
| IA4 | Contract tests can run independently of AppModule contents | `createTestApp()` imports AppModule which already imports all modules; AppModule is stable |

## Conclusion
All spec requirements are explicitly covered in the YAML. No hidden requirements were found. The test will validate 12 explicit requirements (HR1-HR12) and 0 hidden ones.
