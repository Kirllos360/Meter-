# Meter Pulse — Utility Metering & Billing Platform

### Completed Tasks (8 of ~91 — 8.8%)
- **T001**: NestJS backend scaffold — `backend/` structure, main.ts, app.module.ts, package.json, tsconfig.json
- **T002**: Config + PostgreSQL connection — `AppConfigModule`, `DatabaseModule`, `.env`, Docker container `meter-pulse-db`
- **T003**: Backend tooling — ESLint, Prettier, Jest configured; eslint fix: added `jest.config.ts` to ignorePatterns
- **T004**: Prisma ORM init — `schema.prisma` (multiSchema, sim_system), `PrismaService`, `DATABASE_URL`; validated 5/5
- **T005**: Docker PostgreSQL — `docker-compose.yml` (env vars, healthcheck, volume, restart), `README.md` (start/stop/reset/connection docs)
- **T006**: Error envelope + global filter — `ErrorEnvelope` interface, `AllExceptionsFilter`, 10 unit tests; validated 3/3
- **T007**: Correlation-ID middleware — `CorrelationMiddleware` class, registered globally, `req.correlationId` set on every request; 7 unit tests; validated 3/3
- **T008**: Idempotency-Key interceptor — `IdempotencyInterceptor`, Prisma-backed idempotency store, scoped `actor:route:method:key`, safe replay; 15 unit tests; validated 4/4

### Next Unfinished Task
- **T009**: Implement Auth (JWT) + RBAC guard + role model

## T008 Memory Log (2026-05-26)

- **Task**: T008 — Add Idempotency-Key interceptor
- **Status**: done
- **Changed**: Created `idempotency.interceptor.ts`, `idempotency.spec.ts`; added `IdempotencyRecord` model to `schema.prisma`; updated `app.module.ts` (APP_INTERCEPTOR), `tsconfig.json` (jest types)
- **Validation**: npm test ✅ (15/15), npm run build ✅, prisma validate ✅
- **Branch**: `feature/t008-idempotency-interceptor`
- **Next**: T009

## Stack
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

## On-Message Git Check
Every time the user sends a message, run `git status --short` to detect any changes since last session. If changes exist, log them to the audit log and commit log. Keep local files in sync.

## Important quirks
- `.env` files are gitignored. Check `Frontend/.env` for local DB URL and secrets.
- `backend/` is referenced in plan docs but does not exist in this repo yet.
- Constitution (`specify/memory/constitution.md`) is still a template placeholder — must be ratified before implementation closeout.
- Git: no conventional commits, no CI workflows, no branch conventions documented.
- Never commit `*.db`, `.next/`, `node_modules/`, `graphify-out/cache/`, or workspace archives.
