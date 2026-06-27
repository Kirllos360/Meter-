# Dependency Matrix — T022

## Direct Dependencies

| Task | Relationship | Verification | Status |
|---|---|---|---|
| T020 (API Client) | Feature flags select `mock` vs `api` — consumed by T020's `apiGet<T>()` | `src/lib/api/client.ts` exports `apiGet` | ✅ Resolved |
| T021 (React Query) | Feature flags consumed by T021 hooks via `getModuleSource()` | `src/hooks/use-projects.ts` imports flag | ✅ Resolved |
| T012 (Contract Harness) | Referenced in validation reports | — | ✅ Resolved |

## Indirect Dependencies

| Task | Relationship | Verification | Status |
|---|---|---|---|
| T009 (Auth/RBAC) | API endpoint `features.ts` uses Next.js API routes (no auth needed) | Passive | ✅ No conflict |
| T004 (Prisma ORM) | Prisma validate ran successfully | `npx prisma validate` | ✅ No conflict |
| T005 (PostgreSQL) | Database connection verified | `docker compose ps` healthy | ✅ No conflict |
| T006 (Error Envelope) | Referenced in documentation | — | ✅ No conflict |
| T007 (Correlation ID) | Referenced in documentation | — | ✅ No conflict |
| T008 (Idempotency) | Referenced in documentation | — | ✅ No conflict |
| T013-T019 (Migrations) | All 8 migrations applied | `npx prisma migrate status` | ✅ No conflict |

## Forward Dependencies (tasks that depend on T022)

| Task | Dependency | 
|---|---|
| T035 (FE-010 Projects API migration) | Uses `getModuleSource('projects')` to toggle mock/API |
| T036 (FE-011 Customers API migration) | Uses `getModuleSource('customers')` |
| T037 (FE-012 Dashboard wiring) | Uses `getModuleSource('dashboard')` |
| T038 (FE-020 Meters API migration) | Uses `getModuleSource('meters')` |
| T039 (FE-021 Assign workflow) | Uses `getModuleSource('assignments')` |

## Conflict Detection
- ✅ No circular dependencies
- ✅ No missing dependencies
- ✅ No version conflicts
- ✅ No schema conflicts
- ✅ No API contract conflicts
