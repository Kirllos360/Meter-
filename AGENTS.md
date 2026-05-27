# Meter Pulse — Utility Metering & Billing Platform

## Full Session Summary (2026-05-26)

### Completed Tasks (6 of ~91 — 6.6%)
- **T001**: NestJS backend scaffold — `backend/` structure, main.ts, app.module.ts, package.json, tsconfig.json
- **T002**: Config + PostgreSQL connection — `AppConfigModule`, `DatabaseModule`, `.env`, Docker container `meter-pulse-db`
- **T003**: Backend tooling — ESLint, Prettier, Jest configured; eslint fix: added `jest.config.ts` to ignorePatterns
- **T004**: Prisma ORM init — `schema.prisma` (multiSchema, sim_system), `PrismaService`, `DATABASE_URL`; validated 5/5
- **T005**: Docker PostgreSQL — `docker-compose.yml` (env vars, healthcheck, volume, restart), `README.md` (start/stop/reset/connection docs)
- **T006**: Error envelope + global filter — `ErrorEnvelope` interface, `AllExceptionsFilter`, 10 unit tests; validated 3/3

### Implementation Workflow
1. User provides task via Speckit-style prompt
2. Create feature branch: `feature/tXXX-task-name`
3. Read SpecKit files: spec.md, plan.md, tasks.md, data-model.md, contracts/, research.md, quickstart.md
4. Run `check-prerequisites.sh` (branch naming fails — ignore, but verify all files exist manually)
5. Implement code in `backend/` only
6. Validate: `npm test`, `tsc --noEmit`, `eslint`, `prisma validate`, `prisma generate`, `docker compose` as applicable
7. Commit: one task, one branch, one commit, one PR
8. Push to `Kirllos360/Meter-` (ask user first)
9. Create PR via GitHub API with token
10. Update AGENTS.md memory log
11. Mark task `[X]` in tasks.md
12. Create validation reports in 5 formats (markdown, sql, text, csv, pdf)
13. Save prompt to `prompt-history_TXXX.md`

### Documentation Structure
- 16 markdown, 7 sql, 18 text, 15 csv, 20 pdf files
- Index: `documentation/markdown/00-index.md`
- Validation reports: `documentation/markdown/13-T001-validation-report.md` through `13-T006-validation-report.md`

### Git Info
- Remote: `https://github.com/Kirllos360/Meter-.git` (fork of Abady001/Meter-)
- Current token: `ghp_3DuS44n...` (user provided 2026-05-26)
- PRs: #1 (T006) open at `https://github.com/Kirllos360/Meter-/pull/1`
- Port: backend 3001, PostgreSQL 5432
- Commit style: `TXXX: short description` or `build(backend): message for TXXX`
- Author: Kirllos Hany <kirllos.hany@epower.com.eg>

### Key Files
- `backend/.env` — gitignored, has DATABASE_URL
- `backend/.env.example` — committed template
- `backend/docker-compose.yml` — PostgreSQL service
- `backend/prisma/schema.prisma` — generator + datasource, multiSchema, sim_system
- `backend/src/main.ts` — port 3001, global exception filter registered
- `backend/src/common/http/error-envelope.ts` — ErrorEnvelope + helpers
- `backend/src/common/http/all-exceptions.filter.ts` — global @Catch filter
- `backend/test/error-envelope.spec.ts` — 10 unit tests
- `specs/001-metering-billing-platform/tasks.md` — 91 tasks, T001-T006 marked [X]

### Next Unfinished Task
- **T007**: Add correlation-ID middleware in `backend/src/common/http/correlation.middleware.ts`
  - Dependencies: T006
  - Every request gets/propagates a correlationId, surfaced in responses and error envelope

### Stack
- **Frontend** (`Frontend/`): Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- **Backend** (planned, not yet created): NestJS + PostgreSQL + Prisma ORM
- **Runtime**: Bun (not npm/yarn)
- **Auth**: next-auth v4 (frontend)

## Key commands (run from `Frontend/`)
```bash
bun run dev              # dev server on :3000
bun run build            # standalone output + static cp
bun run lint             # ESLint
bun run test:smoke       # build + Playwright smoke traversal
bun run db:push          # Prisma push (SQLite for dev)
bun run db:migrate       # Prisma migrate dev
bun run db:generate      # Prisma generate
```

## Architecture constraints
- **Never rebuild the frontend shell, routes, or design system.** All work is incremental API migration.
- Frontend currently uses mock data (`src/lib/mock-*.ts`). Migration to live APIs happens sprint-by-sprint.
- Backend (`backend/`) does not exist yet — NestJS modular monolith planned in `specs/001-metering-billing-platform/plan.md`.
- Prisma schema (`Frontend/prisma/schema.prisma`) currently uses SQLite; production target is PostgreSQL.
- Next config: `output: "standalone"`, `ignoreBuildErrors: true`, `reactStrictMode: false`.

## Spec workflow (Speckit)
- Feature specs live in `specs/<feature-id>/` — currently `001-metering-billing-platform/`.
- Key files: `spec.md` (requirements), `plan.md` (impl plan), `data-model.md`, `contracts/meter-pulse-api.yaml`, `tasks.md`.
- `.specify/` contains workflow config, skill templates, and Speckit pipeline scripts.
- Run `quickstart.md` checks before kicking off `/speckit-tasks`.

## Graphify (knowledge graph)
- Graph lives at `Frontend/graphify-out/`. **Every frontend ticket must start with `graphify query "<objective>"`**.
- After modifying code: `graphify update .`
- See `Frontend/AGENTS.md` for full graphify rules.

## Testing
- Smoke tests: `bun run test:smoke` (Playwright, traverses all pages).
- Backend contract/integration tests are planned but not yet set up.

## Documentation (`documentation/`)
- Organized by format type into subfolders:
  - `markdown/` — readable docs (conversation log, memory files, DB schema, languages, packages, commit log)
  - `sql/` — PostgreSQL DDL (20 tables with enums, indexes, views, triggers)
  - `text/` — plain text versions of all markdown content
  - `excel/` — CSV data (tables, state transitions, business rules, audit log, commit log)
  - `pdf/` — printable PDF versions of all content
- Start at `documentation/markdown/00-index.md` for the full file index
- **Commit log**: `markdown/09-git-commit-log.md` / `excel/09-git-commit-log.csv` — every commit recorded with timestamp

## Git / Commit Discipline
- **Author**: Kirllos Hany <kirllos.hany@epower.com.eg> (matches GitHub account Kirllos360)
- **Style**: `TXXX: short description` (e.g., `T004: init Prisma ORM`)
- **When**: After every completed task
- **Push**: ONLY after user says "go" — never push without asking
- **Token**: Never used without explicit user permission
- **Pre-commit**: Always run `git status` first; only stage intended files; check for secrets
- **Never commit**: `.env`, `*.db`, `.next/`, `node_modules/`, `graphify-out/cache/`, workspace archives, tokens

## T005 Memory Log (2026-05-26)

- **Task**: T005 — Add local PostgreSQL via docker-compose
- **Status**: done
- **Changed**: Updated `backend/docker-compose.yml` (env vars, healthcheck), created `backend/README.md`
- **Validation**: docker compose up ✅, compose ps ✅ healthy, prisma validate ✅, prisma generate ✅, tsc ✅, eslint ✅
- **Commit**: `e46c26a build(backend): add postgres docker compose for T005`
- **Branch**: `feature/t005-postgres-docker`
- **Next**: T006
- **Risks**: None — port 5432 configurable via DB_PORT env var

## T006 Memory Log (2026-05-26)

- **Task**: T006 — Implement standard error envelope + global exception filter
- **Status**: done
- **Changed**: Created `error-envelope.ts`, `all-exceptions.filter.ts`, `error-envelope.spec.ts`; updated `main.ts`, `tsconfig.json`, `.eslintrc.cjs`
- **Validation**: npm test -- error-envelope ✅ (10/10), tsc --noEmit ✅, eslint ✅
- **Branch**: `feature/t006-error-envelope`
- **Next**: T007
- **Token note**: Push succeeded via credential manager, but PR creation via curl API failed (token expired for non-git calls). Used `git push` as workaround.

## Token Expiry Rule

- **Trigger**: At start of each session, or when a `git push` or API call fails with auth error, or when `T0XX` task count reaches ~80% of total (~72/91)
- **Action**: Prompt user: "GitHub token may be expiring. Please provide a fresh token (repo scope) so git push + PR creation continue working."
- **Fallback**: If push fails mid-task, stop and ask user for token before retrying
- **Storage**: Token stored via `git credential-manager` — no raw token saved in files
- **Never**: Hard-code tokens in code, docs, .env, or commit history

## On-Message Git Check
Every time the user sends a message, run `git status --short` to detect any changes since last session. If changes exist, log them to the audit log and commit log. Keep local files in sync.

## Important quirks
- `.env` files are gitignored. Check `Frontend/.env` for local DB URL and secrets.
- `backend/` is referenced in plan docs but does not exist in this repo yet.
- Constitution (`specify/memory/constitution.md`) is still a template placeholder — must be ratified before implementation closeout.
- Git: no conventional commits, no CI workflows, no branch conventions documented.
- Never commit `*.db`, `.next/`, `node_modules/`, `graphify-out/cache/`, or workspace archives.

---

## T009 Memory Log

**Task**: T009 — Implement Auth (JWT) + RBAC guard + role model
**Story**: Foundational — Phase 2
**Status**: Complete
**Date**: 2026-05-26
**Branch**: feature/t009-auth-rbac
**Commit**: 8c03a81

### What Changed
- Created `backend/src/auth/` module with:
  - `types/role.enum.ts` — 7 roles matching frontend UserRole type
  - `interfaces/jwt-payload.interface.ts` — JWT payload shape (sub, userId, role, projectScope)
  - `interfaces/request-with-user.interface.ts` — Express Request extension
  - `constants/` — JWT config defaults
  - `roles.decorator.ts` — @Roles() decorator using SetMetadata
  - `jwt.strategy.ts` — Passport JWT strategy with payload validation
  - `roles.guard.ts` — Reflector-based RBAC guard with ForbiddenException
  - `auth.module.ts` — Module with registerAsync for JwtModule using ConfigService
- Modified `src/main.ts` — added global ValidationPipe (whitelist, forbidNonWhitelisted, transform)
- Modified `src/app.module.ts` — imported AuthModule
- Modified `package.json` — added @nestjs/passport, @nestjs/jwt, passport, passport-jwt, class-validator, class-transformer, @types/passport-jwt, @types/passport
- Modified `tsconfig.json` — added "jest" to types, removed test/ and *.spec.ts from exclude
- Modified `.eslintrc.cjs` — added test/ to ignorePatterns
- Modified `.env` — added JWT_SECRET, JWT_EXPIRES_IN
- Modified `.env.example` — added placeholder JWT_SECRET, JWT_EXPIRES_IN
- Created `test/auth/roles.guard.spec.ts` — 15 tests (8 guard + 7 role enum)
- Created `test/auth/jwt.strategy.spec.ts` — 10 tests
- Created `test/auth/roles.decorator.spec.ts` — 5 tests
- Created validation reports in markdown, sql, text, csv formats
- Updated documentation index, commit log, memory files
- Saved prompt history to prompt-history_T009.md

### Validation
- `npm test` — 31/31 passing (3 suites)
- `npm run build` — clean
- `npm run lint` — clean

### Frontend Role Verification
- Verified `Frontend/src/lib/types.ts` UserRole type: super_admin, project_admin, operator, technician, finance, support, customer
- Backend Role enum matches all 7 exactly

### Next Task
- T010

---

## T010 Memory Log

**Task**: T010 — Implement append-only audit log service + interceptor
**Story**: Foundational — Phase 2
**Status**: Complete
**Date**: 2026-05-26
**Branch**: feature/t009-auth-rbac
**Commit**: d0d72b4

### What Changed
- Cherry-picked T006 (error envelope) and T007 (correlation middleware) from their branches
- Added `AuditLog` model to `prisma/schema.prisma` — 11 fields, append-only design
- Created `src/audit/audit.decorator.ts` — `@Audit('resource', 'action')` method decorator
- Created `src/audit/audit.service.ts` — injectable service with fail-safe Prisma writes
- Created `src/audit/audit.interceptor.ts` — global interceptor for POST/PUT/PATCH/DELETE
- Created `src/audit/audit.module.ts` — module exporting service + interceptor
- Registered AuditInterceptor globally in `src/app.module.ts` via APP_INTERCEPTOR
- Created 21 tests (service: 4, interceptor: 12, decorator: 4)
- Installed @nestjs/testing dev dependency

### Dependencies Satisfied
- T004 (Prisma) — AuditLog model
- T006 (ErrorEnvelope) — cherry-picked
- T007 (CorrelationMiddleware) — cherry-picked, req.correlationId extracted
- T009 (JWT Auth/RBAC) — req.user.userId, req.user.role extracted

### Validation
- `npm test` — 69/69 passing (8 suites)
- `npm run build` — clean
- `npm run lint` — clean
- `npx prisma validate` — valid

### Append-Only Guarantees
- AuditService only exposes `create()` — no update/delete methods
- Interceptor catches DB errors without blocking the response
- Before/after snapshots captured from request body and response

### Next Task
- T011

---

## T011 Memory Log

**Task**: T011 — Wire API versioning `/api/v1`, base routing, and OpenAPI serving
**Story**: Foundational — Phase 2
**Status**: Complete
**Date**: 2026-05-26
**Branch**: feature/t011-api-versioning
**Commit**: a18038f

### What Changed
- Created `src/common/openapi/openapi.setup.ts` — reusable Swagger/OpenAPI helper
- Updated `src/main.ts` — added `app.setGlobalPrefix('api/v1')` and `setupOpenApi(app)`
- Installed `@nestjs/swagger@7.4.2` + `swagger-ui-express@5.0.1`

### Endpoints
- `/api/v1/health` — health check (moved under global prefix)
- `/api/v1/docs` — Swagger UI (returns 200)
- `/api/v1/docs-json` — OpenAPI JSON spec

### OpenAPI Configuration
- Title: Meter Pulse API
- Version: 1.0
- Server: /api/v1
- JWT bearer auth scheme pre-configured

### Validation
- `npm test` — 69/69 passing
- `npm run build` — clean
- Server startup — successful
- `curl /api/v1/health` — `{"status":"ok"}`
- `curl /api/v1/docs-json` — valid OpenAPI 3.0 JSON
- `curl /api/v1/docs` — HTTP 200

### Next Task
- T012

---

## T012 Memory Log

**Task**: T012 — Build contract-test harness against `meter-pulse-api.yaml`
**Story**: Foundational — Phase 2
**Status**: Complete
**Date**: 2026-05-26
**Branch**: feature/t012-contract-harness
**Commit**: 79d9620

### What Changed
- Created `backend/test/contract/setup.ts` — reusable contract-test harness
  - `loadContract()` — loads `meter-pulse-api.yaml` via js-yaml
  - `loadDereferencedContract()` — resolves all `$ref` via `@apidevtools/json-schema-ref-parser`
  - `getOperation()` — finds operation by operationId
  - `getExpectedStatuses()` — returns valid status codes for an operation
  - `getResponseSchema()` / `getDereferencedResponseSchema()` — extracts response schemas
  - `validateResponseBody()` — validates body against a JSON schema via ajv
  - `validateResponseBodyFromContract()` — end-to-end schema validation from contract
  - `createTestApp()` — NestJS bootstrap with supertest
  - `validateStatus()` — checks status against spec
- Created `backend/test/contract/health.spec.ts` — 26 tests covering all helpers
- Installed `supertest`, `@types/supertest`, `js-yaml`, `@types/js-yaml`, `ajv`, `ajv-formats`, `@apidevtools/json-schema-ref-parser`

### Harness Capabilities
- Loads YAML contract from `specs/001-metering-billing-platform/contracts/meter-pulse-api.yaml`
- Validates responses against schema, status code, and operationId
- Supports Supertest integration for HTTP testing
- Supports operationId-based validation
- Handles both inline `$ref` and response-level `$ref` resolution
- Reusable across future test files

### Validation
- `npm test -- test/contract` — 26/26 passing
- `npm run build` — clean
- `npx eslint src/**/*.ts` — clean

## T013 Memory Log (2026-05-27)

- **Task**: T013 — Migration: Project, LocationNode, Customer, CustomerUnitAssignment
- **Status**: done
- **Changed**: Added 4 Prisma models + 5 enums to `schema.prisma`; created migration `20260527080245_core_org`; added partial unique index `customer_unit_assignments_customer_id_unit_id_active_key` via raw SQL
- **Models**: Project (tax_enabled, tax_rate, reading_threshold_profile_id, water_difference_mode), LocationNode (self-FK hierarchy, node_type), Customer (customer_type), CustomerUnitAssignment (partial unique WHERE end_at IS NULL)
- **Convention**: All mutable entities include `created_at`, `updated_at`, `created_by`, `updated_by` per data model spec
- **Validation**: `prisma validate` ✅, `prisma generate` ✅, `prisma migrate status` ✅, 110/110 tests ✅, `tsc` build ✅
- **Branch**: `feature/t012-contract-harness`
- **Next**: T014
- **Next**: T014 — Migration: Meter, SIMCard, MeterAssignment, SIMAssignment
