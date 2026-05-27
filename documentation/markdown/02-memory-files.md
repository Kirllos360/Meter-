# Memory Files — Meter Pulse

> All agent memory files: AGENTS.md, Speckit constitution, skills, OpenCode config, Graphify.
> Last updated: 2026-05-27

---

## Key Memory Files

| File | Purpose | Last Updated |
|------|---------|-------------|
| `AGENTS.md` | Agent session memory log | 2026-05-27 (T014) |
| `prompt-history_T009.md` | T009 implementation prompt | 2026-05-26 |
| `prompt-history_T010.md` | T010 implementation prompt | 2026-05-26 |
| `prompt-history_T011.md` | T011 implementation prompt | 2026-05-26 |
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

### T010 — Append-only Audit Log

- **Story**: Foundational
- **Status**: Complete
- **What changed**: Created audit module with AuditService, AuditInterceptor, Audit decorator; Prisma AuditLog model (append-only); 21 tests
- **Validation**: 69/69 tests passing, tsc clean
- **Next task**: T011

### T011 — API Versioning + OpenAPI

- **Story**: Foundational
- **Status**: Complete
- **What changed**: Created OpenAPI setup helper, global prefix /api/v1, Swagger UI at /api/v1/docs
- **Validation**: 69/69 tests passing, tsc clean, server startup OK
- **Next task**: T012

### T014 — Migration: Meter, SIMCard, MeterAssignment, SIMAssignment

- **Story**: Foundational
- **Status**: Complete
- **Date**: 2026-05-27
- **Branch**: feature/t014-meter-sim-migration
- **What changed**: Added 4 Prisma models, 5 enums, 4 tables, FK constraints, partial unique indexes (FR-004/FR-005)
- **Validation**: prisma validate ✅, migrate status ✅, 69/69 tests ✅, tsc clean ✅, partial indexes confirmed in pg_indexes ✅
- **Next task**: T015
