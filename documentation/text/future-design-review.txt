# Future Design Review — T047a / T048a

**Date**: 2026-05-31
**Phase**: Design Review

---

## T047a — Automatic Polling Ingestion Adapter

| Dimension | Impact | Notes |
|-----------|--------|-------|
| Architecture | Medium | New adapter module in `readings/` with provider interface |
| Scalability | Medium | Polling cadence must be configurable per meter type |
| Performance | Low | Async, non-blocking — use queue if many meters |
| Security | Medium | Provider credentials must be encrypted at rest |
| Database | Low | No new tables — reuses existing `Reading` model |
| API | None | No new endpoints — same `POST /readings` contract |
| Graph | Low | New community for adapter code |

**Recommended sequence**: After T048 (complete) → T048a → T047a

---

## T048a — Approve/Reject/Correct Review Actions

| Dimension | Impact | Notes |
|-----------|--------|-------|
| Architecture | High | New controller actions + state machine for reading lifecycle |
| Scalability | Low | Single-record operations |
| Performance | Low | Instantaneous |
| Security | High | Only authorized roles can approve/reject — enforce RBAC |
| Database | Low | New `reviewed_by` + `reviewed_at` + `resolution` fields on `Reading` |
| API | Medium | `POST /readings/{id}/approve`, `POST /readings/{id}/reject`, `POST /readings/{id}/correct` |
| Graph | Medium | New nodes for review actions + state transitions |

**Recommended sequence**: After T048 (complete) → T048a → T047a

---

## Implementation Order
1. **T048a first** — unlocks US3 billing (can't generate invoices from unapproved readings)
2. **T047a second** — nice-to-have automation
