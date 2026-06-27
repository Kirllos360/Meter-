# Risk Mitigation Report — T023

## Risk Table

| # | Risk | Probability | Impact | Mitigation | Contingency |
|---|---|---|---|---|---|
| R1 | Contract harness helpers behave differently with $ref schemas | Low | Medium | Test schema validation against known-good OperationIds first (healthCheck proven in T012) | Fall back to inline schema assertions |
| R2 | Test fails in unexpected ways (e.g., import error, module resolution) | Low | High | Run `npm test` with single-file filter first; verify `tsc` compiles test directory | Read error output, fix import paths |
| R3 | AJV validation errors differ from expected spec contracts | Low | Medium | Use `validateResponseBody` which wraps AJV; errors are descriptive | Compare schema manually against YAML |
| R4 | T023 passes too early (T031 already implemented) | Low | High | Verify T031 branch does not exist; confirm `backend/src/meters/` is empty except `.gitkeep` | Confirm by checking git status |
| R5 | Test timeout (30s Jest default) | Low | Low | Existing `jest.setTimeout(30000)` in setup.spec.ts covers integration tests | Increase timeout or split tests |

## TDD Risk: False Positive
The contract test must FAIL when the endpoint doesn't exist. If all tests pass, it means either:
- The endpoint already exists (check T031/backlog)
- The test is not actually exercising the endpoint (review test logic)
- Supertest is catching the 404 and the test is too permissive

**Mitigation**: The HTTP endpoint test explicitly asserts `validateStatus(operationId, res.status)` — for `assignMeter`, valid statuses are `[200, 409]`. A 404 will cause `validateStatus` to return `false`, making the test fail.

## Spec Drift Risk
If the spec changes after T023 is written, the test may reference stale schemas.
**Mitigation**: All schema references go through `getResponseSchema()` which reads the spec dynamically. Schema changes are automatically reflected.

## Risk Summary
**Total risks identified: 6**
**High: 2** (R2, R4) — both mitigated by pre-checks
**Medium: 3** (R1, R3, R5) — all have clear contingency plans
**Low: 1** (R5 timeout) — trivial to address
