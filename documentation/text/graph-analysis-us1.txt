# Graph Analysis — US1 Frontend (T035–T042)

**Date**: 2026-05-31  
**Graph State**: 3175 nodes, 243K edges, 109 communities  
**Phase**: Phase 2 — Graphify Discovery

---

## 1. Current Architecture (from Graph)

### Community Map (Frontend)

| Community | Content | Key Nodes |
|-----------|---------|-----------|
| C1 | UI components (shadcn/ui) | button, card, select, input, tabs, dropdown-menu |
| C2 | Frontend lib + layout | utils, types, navigation, AppShell, AppSidebar, TopNav |
| C6 | Frontend hooks + API + dashboard | useProjects, useCustomers, useDashboard, DashboardPage |
| C10 | Backend meters | meters controller, service, DTOs |
| C14 | Backend SIM cards | sim-cards controller, service, DTOs |
| C18 | Backend customers | customers controller, service, DTOs |
| C19 | Backend locations | locations controller, service, DTOs |
| C20 | Backend projects | projects controller, service, DTOs |
| C24 | Backend dashboard | dashboard controller, service |

### Data Flow (Pages → Hooks → API)
```
ProjectsPage → useProjectsList() → apiGet('/projects')
CustomerDetailPage → useCustomersList(projectId) → apiGet('/projects/{id}/customers')
DashboardPage → useDashboardKpis(projectId) → apiGet('/projects/{id}/dashboard/kpis')
MetersPage → useMetersList() → apiGet('/meters')
MeterDetailPage → useMeterDetail(id) → apiGet('/meters/{id}')
SimCardsPage → useSimCardsList() → apiGet('/sim-cards')
MeterAssignPage → useMutation → apiPost('/meters/{id}/assign')
MeterTerminatePage → useTerminateMeter() → apiPost('/meters/{id}/terminate')
```

---

## 2. Required Changes

| Task | Current (Mock) | Target (API) | Safe Points |
|------|---------------|--------------|-------------|
| T035 | `mockProjects`, `mockBuildings` | `useProjectsList()`, `useLocationsList()` | Feature flag controls switch; mock fallback preserved |
| T036 | `mockCustomers` | `useCustomersList(projectId)` | ProjectDetailPage tabs already have customers tab |
| T037 | `mock...` in dashboard | `useDashboardKpis()`, `useConsumptionTrend()` | Hooks already wired, just need to consume |
| T038 | `mockMeters`, `mockSimCards` | `useMetersList()`, `useSimCardsList()` | List views already use hooks with mock fallback |
| T039 | Mock assignment flow | Real API mutation with Idempotency-Key | Mutation hook exists |
| T040 | Mock termination | Real API with final reading validation | Mutation hook exists |
| T041 | Mock SIM status | Real eligibility API | Hook exists with 30s cache |

---

## 3. Potential Regressions

| Change | Regression Risk | Mitigation |
|--------|----------------|------------|
| Switch ProjectsPage to API | Table columns/data may shift | Compare mock vs API response shape at hook boundary |
| Switch ProjectDetail tabs | Tab state may reset | Snapshot tab state before edit |
| Switch Dashboard to API | Chart may crash on unexpected data | Validate at hook boundary before chart component |
| Status enum change | Badge colors wrong | Reconcile `types.ts` with backend Role enum pattern |
| Assignment conflict handling | 409 error not surfaced in UI | Add `onError` handler to mutation |

---

## 4. Integration Sequence

```
T035 ─→ T036 ─→ T037 ─→ T038 ─→ T039 ─→ T040 ─→ T041 ─→ T042
                      ↘         ↘         ↘
                    Dashboard   Meters    SIM
                    wiring      +SIM      cooldown
                                API       UI
```

Each task activates one module's feature flag from mock to API, starting with the simplest (Projects list) and building up to the most complex (SIM cooldown UI).
