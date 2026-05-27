# AI Handoff Memory — Meter Pulse (2026-05-27)

> **Purpose**: Complete state document so any AI model can continue work without reading the full conversation history.
> **Author**: Kirllos Hany
> **Last Updated**: 2026-05-27

---

## 1. Project Overview

Utility Metering & Billing Platform — NestJS backend + PostgreSQL (Prisma ORM).

**Repositories**:
- Fork (work): `https://github.com/Kirllos360/Meter-.git`
- Upstream (target): `https://github.com/Abady001/Meter-.git`

**Stack**: NestJS, PostgreSQL 16, Prisma ORM 6.19.3, Jest, TypeScript, JWT auth, Swagger/OpenAPI

**Working Directory**: `D:\meter\Meter-`

---

## 2. Current Branching State

| Branch | Purpose | Status | Remote |
|--------|---------|--------|--------|
| `feature/t013-core-org-migration` | T013: Project, LocationNode, Customer | PR #12 OPEN ✅ | origin |
| `feature/t008-idempotency-v2` | T008: Idempotency-Key interceptor | PR #13 OPEN ✅ | origin |
| `feature/t014-meter-sim-migration` | T014: Meter, SIMCard | PR #15 OPEN ✅ | origin |
| `feature/t015-readings-tariff-migration` | **CURRENT** — T015: Reading, TariffPlan, BillingPeriod | PR #16 OPEN ✅ | origin |
| `feature/t012-contract-harness` | T012+T013 bundle (BROKEN) | PR #14 **CLOSED** | origin (stale) |
| `abady/main` | Upstream target branch | — | abady |

---

## 3. Task Completion (T001–T015)

| Task | Description | Status | On `abady/main`? |
|------|-------------|--------|-------------------|
| T001 | NestJS Backend Scaffold | ✅ Done | ✅ Yes |
| T002 | Config + PostgreSQL Connection | ✅ Done | ✅ Yes (PR #1) |
| T003 | Lint/Format/Test Tooling | ✅ Done | ✅ On `001-metering-billing-platform` branch (PR #2) |
| T004 | Initialize Prisma ORM | ✅ Done | ✅ Yes (commit `0629776`) |
| T005 | Local PostgreSQL via Docker | ✅ Done | ✅ Yes (PR #3) |
| T006 | Error Envelope + Global Filter | ✅ Done | ✅ Yes (commit `3905f3a`) |
| T007 | Correlation-ID Middleware | ✅ Done | ✅ Yes (commit `4f12da5`) |
| T008 | Idempotency-Key Interceptor | ✅ Done | ❌ No — PR #13 **OPEN** |
| T009 | Auth (JWT) + RBAC Guard | ✅ Done | ✅ Yes (PR #6) |
| T010 | Append-only Audit Log | ✅ Done | ✅ Yes (commit `d0d72b4`) |
| T011 | API Versioning + OpenAPI | ✅ Done | ✅ Yes (PR #7) |
| T012 | Contract-Test Harness | ✅ Done | ❌ No — PR #14 **CLOSED**, needs separate PR |
| T013 | Core Org Prisma Migration | ✅ Done | ❌ No — PR #12 **OPEN** |
| T014 | Meter/SIM Prisma Migration | ✅ Done | ❌ No — PR #15 **OPEN** |

---

## 4. All Prisma Models (current schemas)

### On `abady/main`:
- `AuditLog` → `audit_log`

### On `feature/t013-core-org-migration` (PR #12):
- `AuditLog` → `audit_log`
- `Project` → `projects`
- `LocationNode` → `location_nodes`
- `Customer` → `customers`
- `CustomerUnitAssignment` → `customer_unit_assignments`
- **Enums**: `ProjectStatus`, `WaterDifferenceMode`, `NodeType`, `CustomerType`, `EntityStatus`
- **Migration**: `20260527092641_core_org`
- **Partial unique**: `customer_unit_assignments(customer_id, unit_id) WHERE end_at IS NULL`

### On `feature/t008-idempotency-v2` (PR #13):
- `AuditLog` → `audit_log`
- `IdempotencyRecord` → `idempotency_records`
- **Migration**: `20260527094338_add_idempotency_record`
- **Source files**: `idempotency.interceptor.ts`, `app.module.ts` (adds APP_INTERCEPTOR), `idempotency.spec.ts` (18 tests)

### On `feature/t014-meter-sim-migration` (PR #15) — CURRENT:
- `AuditLog` → `audit_log`
- `Meter` → `meters`
- `SIMCard` → `sim_cards`
- `MeterAssignment` → `meter_assignments`
- `SIMAssignment` → `sim_assignments`
- **Enums**: `MeterType`, `MeterStatus`, `IpType`, `SimStatus`, `AssignmentStatus`
- **Migration**: `20260527100316_meter_sim`
- **Partial unique**: `meter_assignments(meter_id) WHERE end_at IS NULL` (FR-004)
- **Partial unique**: `sim_assignments(sim_id) WHERE end_at IS NULL` (FR-005)

---

## 5. Critical Fix Applied (2026-05-27)

### The Bug
All three PR branches (T013, T008, T014) had migrations containing `CREATE TABLE "audit_log"` — but the `audit_log` table **already exists on `abady/main`** (created by T010). This happened because each branch's Prisma migration was generated from a schema that included the `AuditLog` model, but none had the T010 migration in their history, so Prisma emitted the full schema DDL.

### The Fix
Removed the `CREATE TABLE "audit_log"` block from all three migration SQL files:

| Branch | Migration File | SHA |
|--------|---------------|-----|
| `feature/t013-core-org-migration` | `20260527092641_core_org/migration.sql` | `42db219` |
| `feature/t008-idempotency-v2` | `20260527094338_add_idempotency_record/migration.sql` | `8db1a39` |
| `feature/t014-meter-sim-migration` | `20260527100316_meter_sim/migration.sql` | `d844c0e` |

### Verification (all 3 merged together)
- `prisma migrate reset --force` → 3 migrations applied cleanly in sequence ✅
- `prisma migrate status` → up-to-date ✅
- `npm test` → **87/87 passing** (9 suites) ✅
- `tsc` → clean ✅

### Lesson for Future Tasks
When creating a new Prisma branch from a schema that already has tables on `main`:
1. Run `prisma migrate diff` or manually inspect the generated migration SQL
2. Remove any `CREATE TABLE` statements for tables that already exist on the target branch
3. Only keep the DDL for your **new** models/additions

---

## 6. Open PRs on Abady001/Meter-

| # | Branch | Title | Mergeable | Action |
|---|--------|-------|-----------|--------|
| 15 | `feature/t014-meter-sim-migration` | T014: Meter/SIM migration | ✅ MERGEABLE | Merge after T013+T008 |
| 13 | `feature/t008-idempotency-v2` | T008: Idempotency interceptor | ✅ MERGEABLE | Merge any time |
| 12 | `feature/t013-core-org-migration` | T013: Core org migration | ✅ MERGEABLE | Merge first (foundation) |

**Recommended merge order**: #12 → #13 → #15 (or any order — Prisma sorts by timestamp)

---

## 7. Test Results (latest)

```
Test Suites: 9 passed, 9 total
Tests:       87 passed, 87 total
```

Suites:
1. `test/error-envelope.spec.ts` — T006
2. `test/correlation.spec.ts` — T007
3. `test/auth/roles.decorator.spec.ts` — T009
4. `test/auth/roles.guard.spec.ts` — T009
5. `test/auth/jwt.strategy.spec.ts` — T009
6. `test/audit/audit.decorator.spec.ts` — T010
7. `test/audit/audit.interceptor.spec.ts` — T010
8. `test/audit/audit.service.spec.ts` — T010
9. `test/idempotency.spec.ts` — T008 (18 tests, added on T008 branch)

---

## 8. Architecture Decisions

- **Multi-schema**: All Prisma models under `@@schema("sim_system")`, `multiSchema` preview feature
- **Snake_case DB**: `@map()` for every field/table/enum value to snake_case
- **TEXT UUIDs**: All IDs are `String @id @default(uuid())` (TEXT, not native UUID type)
- **Partial unique indexes**: Implemented via raw SQL appended to migration files (Prisma has no `WHERE` clause support)
- **Idempotency**: Global interceptor via `APP_INTERCEPTOR`, checks `Idempotency-Key` header, stores in `IdempotencyRecord` table
- **Interceptors order**: `AuditInterceptor` first, then `IdempotencyInterceptor` (in `app.module.ts`)
- **Audit**: Append-only, fail-safe (logs `[AuditService] Failed to write audit log` on error, doesn't block response)

---

## 9. Known Issues / Future Work

1. **TTL cleanup for IdempotencyRecord**: `expiredAt` is defined but never set or checked — table grows unbounded. Non-blocking for MVP.
2. **T012 contract harness**: Code exists on stale `feature/t012-contract-harness` branch. Needs a fresh PR on a new branch from `abady/main`.
3. **T013 FK references from T014**: `MeterAssignment.customerId`, `MeterAssignment.unitId`, `MeterAssignment.projectId` are scalar fields without `@relation` — need FK constraints when T013 merges.
4. **AGENTS.md**: Missing T006/T007/T008 memory log entries on `abady/main` — update when merging.
5. **`multiSchema` deprecated warning**: Prisma warns that this preview feature is deprecated. Safe to ignore for now.

---

## 10. Git Credentials

- **Author**: Kirllos Hany <kirllos.hany@epower.com.eg>
- **GitHub CLI**: `C:\Program Files\GitHub CLI\gh.exe` (authenticated as Kirllos360 via PAT)
- **Push protocol**: Push to `origin` (Kirllos360 fork), PR to `abady` (Abady001 upstream)
- **Token scopes**: Full (repo, workflow, admin) — stored in Windows Credential Manager

---

## 11. Key File Paths

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | All Prisma models + enums |
| `backend/prisma/migrations/` | Migration history |
| `backend/src/app.module.ts` | Module wiring, interceptor registration |
| `backend/src/common/http/idempotency.interceptor.ts` | Idempotency interceptor (T008) |
| `backend/src/common/http/correlation.middleware.ts` | Correlation middleware (T007) |
| `backend/src/common/http/error-envelope.ts` | Error envelope (T006) |
| `backend/src/common/http/all-exceptions.filter.ts` | Global exception filter (T006) |
| `backend/src/auth/` | Auth module (T009) |
| `backend/src/audit/` | Audit module (T010) |
| `backend/src/main.ts` | API prefix `/api/v1`, Swagger setup (T011) |
| `backend/test/contract/` | Contract harness (T012) — only on stale branch |
| `AGENTS.md` | Agent memory log |
| `specs/001-metering-billing-platform/tasks.md` | Task tracking |
| `documentation/markdown/00-index.md` | Documentation index |
| `documentation/markdown/15-ai-handoff-memory.md` | **This file** — AI handoff |

---

## 12. Graphify State

- **Nodes**: 2126
- **Edges**: 3253
- **Communities**: 169
- **Output**: `graphify-out/` (graph.html, GRAPH_REPORT.md, graph.json)

---

## 13. Next Steps

1. Merge PR #12 (T013), PR #13 (T008), PR #15 (T014) on Abady001/Meter-
2. Create standalone T012 PR (contract harness) from fresh `abady/main` branch
3. T015 ✅ — Reading, ReadingReview, TariffPlan, BillingPeriod (PR #16)
4. Start T016 — Invoice, InvoiceLine, InvoiceAdjustment
4. Add FK relations from T014 to T013 models after both are merged
5. Implement TTL cleanup for IdempotencyRecord (cron or interceptor logic)
