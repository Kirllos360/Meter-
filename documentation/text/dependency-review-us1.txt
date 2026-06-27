# Dependency Review — US1 Frontend (T035–T042)

**Generated**: 2026-05-31
**Phase**: Phase 1 — Pre-Implementation Analysis

---

## 1. Direct Dependencies

### T035 — Projects + Locations API Migration
| Dependency | Type | Status | Risk |
|-----------|------|--------|------|
| T027 (Projects module) | Backend | ✅ Done | Endpoint shape must match hook expectations |
| T028 (Locations module) | Backend | ✅ Done | Nested location hierarchy may break UI |
| T022 (Feature flags) | Frontend | ✅ Done | Flag must remain mock until verified |
| `useProjectsList()` | Hook | ✅ Exists | Uses `apiGet` — will work in API mode |
| `useLocationsList()` | Hook | ✅ Exists | Not yet consumed in LocationsPage — needs integration |

### T036 — Customers API Migration
| Dependency | Type | Status | Risk |
|-----------|------|--------|------|
| T029 (Customers module) | Backend | ✅ Done | Customer list pagination contract |
| T022 (Feature flags) | Frontend | ✅ Done | Flag per customer module |
| `useCustomersList()` | Hook | ✅ Exists | Scoped by projectId |

### T037 — Dashboard KPI Wiring
| Dependency | Type | Status | Risk |
|-----------|------|--------|------|
| T034 (Dashboard endpoints) | Backend | ✅ Done | KPI date range + project scope |
| T022 (Feature flags) | Frontend | ✅ Done | Dashboard feature flag |
| `useDashboardKpis()` | Hook | ✅ Exists | Chart data shape must match |

### T038 — Meters + SIM API Migration
| Dependency | Type | Status | Risk |
|-----------|------|--------|------|
| T030 (Meters module) | Backend | ✅ Done | Status enum values may mismatch frontend |
| T031 (SIM module) | Backend | ✅ Done | SIM eligibility contract |
| T022 (Feature flags) | Frontend | ✅ Done | Flag per module |
| `useMetersList()`, `useSimCardsList()` | Hooks | ✅ Exists | Detail views need assignment history |

### T039 — Meter Assignment Hardening
| Dependency | Type | Status | Risk |
|-----------|------|--------|------|
| T032 (Assignment command) | Backend | ✅ Done | Idempotency-Key required |
| T038 (Meters API) | Frontend | ⏳ In Progress | Must complete T038 first |
| T022 (Feature flags) | Frontend | ✅ Done | Flag controls mock fallback |

### T040 — Meter Replacement + Termination
| Dependency | Type | Status | Risk |
|-----------|------|--------|------|
| T033 (Termination command) | Backend | ✅ Done | Final reading required |
| T038 (Meters API) | Frontend | ⏳ In Progress | Must complete T038 first |
| `useTerminateMeter()` | Hook | ✅ Exists | Mutations already wired |

### T041 — SIM Cooldown + Reuse UI
| Dependency | Type | Status | Risk |
|-----------|------|--------|------|
| T031 (SIM eligibility) | Backend | ✅ Done | Eligibility endpoint live |
| T040 (Termination) | Frontend | ⏳ In Progress | SIM reuse after termination |
| `useSimEligibility()` | Hook | ✅ Exists | 30s cache already configured |

---

## 2. Indirect Dependencies

| Module | Affected By | Impact |
|--------|------------|--------|
| `ApiClient` (client.ts) | All T035-T041 | Error handling, auth headers, correlation ID — no changes needed |
| `QueryClient` (query-client.tsx) | All T035-T041 | 30s staleTime, 5min gcTime — no changes needed |
| `QueryBoundary` | All T035-T041 | Loading/error/empty — must cover all new API hooks |
| `FeatureFlags` | All T035-T041 | Each module toggles mock↔api independently |
| `Role navigation` (navigation.ts) | T038-T041 | Sidebar menu items — no layout change |
| `types.ts` | T038-T041 | Enum values must match backend exactly |

---

## 3. Affected Files

### Files to Modify
| Task | Files |
|------|-------|
| T035 | `ProjectsPage.tsx`, `ProjectDetailPage.tsx`, `LocationsPage.tsx` |
| T036 | `CustomersPage.tsx`, `CustomerDetailPage.tsx` |
| T037 | `DashboardPage.tsx` |
| T038 | `MetersPage.tsx`, `MeterDetailPage.tsx`, `SimCardsPage.tsx` |
| T039 | `MeterAssignPage.tsx` |
| T040 | `MeterReplacePage.tsx`, `MeterTerminatePage.tsx` |
| T041 | `SimCardsPage.tsx` |
| T042 | `graphify-out/` — graph refresh |

### Files NOT to Modify
- `AppShell.tsx`, `AppSidebar.tsx`, `TopNav.tsx` — no layout/route changes
- `navigation.ts` — role nav preserved
- `client.ts`, `query-client.tsx`, `feature-flags.ts` — foundation untouched
- Any `mock-*.ts` — preserved for fallback

---

## 4. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Backend endpoint shape differs from frontend expectations | High | Validate at hook boundary; mock fallback on |
| Status enum values mismatch between frontend `types.ts` and backend | High | Reconcile before T038 |
| Pagination contract mismatch (page vs cursor) | Medium | Server-side pagination assumed; verify first call |
| Tab state lost after API migration | Medium | Snapshot existing behavior before editing |
| Chart data shape change crashes render | High | Validate at hook boundary with type guards |
| Double-submit on assignment without Idempotency-Key | High | Enforce pending state + key generation in T039 |

---

## 5. Validation Targets

| Check | Command | Expected |
|-------|---------|----------|
| Lint | `bun run lint --no-cache --max-warnings 0` | 0 errors, 0 warnings |
| Build | `bun run build` | Next.js clean |
| Smoke | `bun run test:smoke` | All pages traversable |
| Mock mode | Set all flags to mock | All pages render with mock data |
| API mode | Set one flag to api | That module loads from backend |
| Graphify | `graphify update .` | Graph updates without error |
| Backend tests | `cd backend && npm test` | 316/316 pass |
