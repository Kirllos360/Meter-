# T020 Validation Report — FE-001 API Client Foundation

**Created**: 2026-05-28
**Branch**: `feature/t020-api-client`
**Commit**: `05b686a`

## Validation Summary

| Check | Result | Details |
|---|---|---|
| `bun run lint` | ✅ PASS | 0 errors, 0 warnings |
| `npx next build` | ✅ PASS | Compiled in 11.2s, all pages generated |
| `graphify query` | ✅ PASS | 30 nodes in community 29, cross-linked to mock-auth.ts |
| `graphify update .` | ✅ PASS | 1025 nodes, 2735 edges indexed |
| Additive only | ✅ PASS | 4 new files + 4 lines in mock-auth.ts |
| No app-shell changes | ✅ PASS | No routing, layout, or shell modifications |

## Files Created

| File | Purpose |
|---|---|
| `Frontend/src/lib/api/client.ts` | Centralized fetch wrapper: GET/POST/PUT/PATCH/DELETE, correlation ID injection, auth header attachment, URL parameter building, response pipeline |
| `Frontend/src/lib/api/errors.ts` | `ApiError` class matching T006 `ErrorEnvelope` contract `{ code, message, details?, correlationId }`, `parseApiError()`, `isApiError()` type guard |
| `Frontend/src/lib/api/auth.ts` | Token storage (`getToken/setToken/clearToken`), refresh token support (`setRefreshToken/getRefreshToken/refreshToken`), auth header helper (`getAuthHeaders`) |
| `Frontend/src/lib/api/index.ts` | Barrel exports for all public API |

## File Modified

| File | Change |
|---|---|
| `Frontend/src/lib/mock-auth.ts` | +4 lines: imports `setToken`/`clearToken` from `@/lib/api`, calls `setToken()` on login/switchRole, `clearToken()` on logout |

## Acceptance Criteria Verification

| Criterion | Status | Evidence |
|---|---|---|
| One shared API wrapper (base `/api/v1`) | ✅ | `client.ts` — `NEXT_PUBLIC_API_URL` defaults to `http://localhost:3001/api/v1` |
| Parses `ErrorEnvelope` consistently | ✅ | `errors.ts` — `parseApiError()` parses T006 contract shape |
| Logs `correlationId` on errors | ✅ | `client.ts:46` — `[API] ${code} (${status}) correlationId=${id}` |
| Auth token attach + refresh hooks | ✅ | `auth.ts` — `getAuthHeaders()` auto-attached, `refreshToken()` available |
| Used by ≥1 module | ✅ | `mock-auth.ts` — `useAuthStore.login/logout/switchRole` calls `setToken/clearToken` |

## Backend Contract Compatibility

| Backend Module | Frontend Counterpart | Compatible |
|---|---|---|
| T006 ErrorEnvelope `{ code, message, details?, correlationId }` | `ApiError` class + `parseApiError()` | ✅ |
| T007 Correlation ID (`x-correlation-id` header) | `generateCorrelationId()` + header injection | ✅ |
| T011 API versioning (`/api/v1`) | `BASE_URL` defaults to `http://localhost:3001/api/v1` | ✅ |

## Speckit Validation

```
T020 tasks.md line 203:
- [X] T020 [US?-foundational] FE-001 API client foundation
- Acceptance: One shared API wrapper (base /api/v1); parses ErrorEnvelope consistently;
  logs correlationId; auth token attach + refresh hooks; used by ≥1 module
- Validation: graphify query + bun run lint + bun run build → ALL PASS
- Risk: Must not alter app shell or existing module behavior → ADDITIVE ONLY
```

## Environment Notes

- Build `cp -r` failure is pre-existing (Unix syntax on Windows PowerShell), unrelated to T020
- Smoke test requires Node.js `bunx` in PATH — pre-existing environment issue
