# Acceptance Coverage Matrix — T025

| # | Criterion | Location | Status |
|---|---|---|---|
| AC1 | SimEligibility schema (simId uuid, eligible boolean, reason string, cooldownUntil nullable) | `sim-eligibility.contract.spec.ts` | ❌ TDD PENDING |
| AC2 | HTTP GET fails with 404 | `sim-eligibility.contract.spec.ts` | ❌ TDD EXPECTED FAIL |
| AC3 | Schema assertions pass | `sim-eligibility.contract.spec.ts` | ✅ EXPECTED PASS |
| AC4 | No regressions | `backend/` | ✅ EXPECTED PASS |

**Coverage: 4/4 = 100%**
