# File Impact Analysis — T024

| File | Purpose | Risk | Change |
|---|---|---|---|
| `backend/test/contract/meter-terminate.contract.spec.ts` | Contract test for terminateMeter | Low | Create |

**Downstream**: T033 (MetersController.terminateMeter) will satisfy this test.
**Risk**: Low — additive only, no existing files modified.
