# Prompt History — T008

**Task**: Add Idempotency-Key interceptor
**Phase**: Phase 2 — Foundational (Backend cross-cutting infrastructure)
**Date**: 2026-05-26

## Full Prompt

[The full Speckit-style implementation prompt for T008 was provided by the user on 2026-05-26.]

## Key Specs

- **Dependencies**: T002, T004
- **Area/Files**: `backend/src/common/http/idempotency.interceptor.ts`, `backend/prisma/schema.prisma`, `backend/test/idempotency.spec.ts`
- **Acceptance**: Repeat mutation with same Idempotency-Key returns original result; duplicate mutation must not execute twice
- **Validation**: `cd backend && npm test -- idempotency`, `npm run build`, `npx prisma validate`

## Implementation Summary

1. Added `IdempotencyRecord` model to `prisma/schema.prisma` (scoped key, response storage, timestamps)
2. Created `IdempotencyInterceptor` (NestInterceptor) that:
   - Inspects `Idempotency-Key` header on POST/PUT/PATCH/DELETE
   - Builds scoped key: `actor:route:method:idempotency-key`
   - Looks up in Prisma; replays response if found; caches response on first execution
   - Falls through safely on DB errors
3. Registered interceptor globally via `APP_INTERCEPTOR` in AppModule
4. Added 15 unit tests

## Validation Results

- `npm test -- idempotency`: ✅ 15/15 passed
- `npm test`: ✅ 15/15 passed
- `npm run build`: ✅
- `npx prisma validate`: ✅
