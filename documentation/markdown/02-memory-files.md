# Memory Files — Meter Pulse

> All agent memory files: AGENTS.md, Speckit constitution, skills, OpenCode config, Graphify.
> Last updated: 2026-05-28

---

## Key Memory Files

| File | Purpose | Last Updated |
|------|---------|-------------|
| `AGENTS.md` | Agent session memory log | 2026-05-28 (T017) |
| `prompt-history_T009.md` | T009 implementation prompt | 2026-05-26 |
| `prompt-history_T012.md` | T012 contract harness prompt | 2026-05-28 |
| `.specify/memory/constitution.md` | Speckit constitution (template) | N/A |

---

## AGENTS.md Contents

### T009 — Implement Auth (JWT) + RBAC guard + role model

- **Story**: Foundational
- **Status**: Complete
- **What changed**: Created auth module with JWT strategy, RolesGuard, Roles decorator, role enum (7 roles), JWT payload interfaces, global validation pipe
- **Files**: `src/auth/*.ts`, `test/auth/*.ts`, `src/main.ts`, `src/app.module.ts`, `package.json`, `tsconfig.json`, `.eslintrc.cjs`, `.env`, `.env.example`
- **Validation**: 31 tests passing, tsc clean, eslint clean
- **Frontend roles verified**: super_admin, project_admin, operator, technician, finance, support, customer
- **Next task**: T010

---

### T010 — Implement Append-Only Audit Log

- **Story**: Foundational
- **Status**: Complete
- **What changed**: Created AuditLog model, AuditService (injectable, fail-safe), AuditInterceptor (global), AuditDecorator. Cherry-picked T006+T007.
- **Files**: `src/audit/*.ts`, `prisma/schema.prisma`, `src/app.module.ts`
- **Validation**: 69 tests passing, tsc clean, eslint clean
- **Next task**: T011

---

### T011 — Wire API Versioning + OpenAPI

- **Story**: Foundational
- **Status**: Complete
- **What changed**: Global prefix /api/v1, Swagger/OpenAPI setup with JWT bearer
- **Files**: `src/main.ts`, `src/common/openapi/openapi.setup.ts`
- **Validation**: 69 tests passing, /api/v1/health returns ok, /api/v1/docs returns 200
- **Next task**: T012

---

### T012 — Build Contract Test Harness

- **Story**: Foundational
- **Status**: Complete
- **What changed**: Created setup.ts (YAML loading, custom $ref deref, AJV validation, supertest app factory), 8 contract tests, added GET /health to OpenAPI spec
- **Files**: `test/contract/setup.ts`, `test/contract/setup.spec.ts`, `specs/*/contracts/meter-pulse-api.yaml`
- **Packages**: supertest, ajv, ajv-formats, js-yaml (@apidevtools/swagger-parser removed — ESM-only)
- **Validation**: 77 tests passing, build clean
- **Next task**: T013

---

### T013 — Migration: Project, LocationNode, Customer, CustomerUnitAssignment

- **Story**: Phase 2 (schema)
- **Status**: Complete
- **What changed**: Core org models in Prisma schema with enums, self-FK hierarchy, partial unique indexes, project config columns
- **Next task**: T014

---

### T014 — Migration: Meter, SIMCard, MeterAssignment, SIMAssignment

- **Story**: Phase 2 (schema)
- **Status**: Complete
- **What changed**: Meter/SIM models with unique serial_number/iccid, partial unique indexes via raw SQL WHERE end_at IS NULL
- **Next task**: T015

---

### T015 — Migration: Reading, ReadingReview, TariffPlan, BillingPeriod

- **Story**: Phase 2 (schema)
- **Status**: Complete
- **What changed**: Reading with unique (meter_id, reading_at, source), jsonb defaults, DECIMAL(12,3)
- **Next task**: T016

---

### T016 — Migration: Invoice, InvoiceLine, InvoiceAdjustment

- **Story**: Phase 2 (schema)
- **Status**: Complete
- **What changed**: Invoice with unique invoice_number, utility_type/status enums, immutable_at, consistent DECIMAL(12,3)
- **Next task**: T017

---

### T017 — Migration: Payment, PaymentAllocation, CustomerLedgerEntry

- **Story**: Phase 2 (schema)
- **Status**: Complete
- **What changed**: Payment with unique payment_number, PaymentAllocation with order, CustomerLedgerEntry append-only with DB trigger trg_customer_ledger_append_only
- **Validation**: DB-level trigger verified — UPDATE/DELETE raise exception
- **Next task**: T018

---

### T018 — Migration: AuditLog index + ReportJob

- **Story**: Phase 2 (schema)
- **Status**: Complete
- **What changed**: AuditLog @@index([createdAt]), ReportJobStatus/ReportFormat enums, ReportJob model
- **Next task**: T019

---

### T019 — Migration: Derived Views

- **Story**: Phase 2 (schema)
- **Status**: Complete
- **What changed**: 3 views — meter_assignment_active_view (7 cols), sim_assignment_active_view (6 cols), customer_statement_view (8 cols with debit/credit from amount_delta, running_balance)
- **Dependencies**: T014 (meter_assignments, sim_assignments), T017 (customer_ledger_entries)
- **Risks**: Views break if source tables/columns renamed; document dependency chain
- **Next task**: T020
