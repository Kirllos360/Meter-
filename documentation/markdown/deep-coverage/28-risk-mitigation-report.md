# Risk Mitigation Report — T025

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| cooldownUntil nullable — AJV null handling | Low | Low | Test with null and omitted cooldownUntil |
| GET endpoint has no request body — different test pattern | Low | Low | Use `request.get(...)` instead of `request.post(...)` |
| Test passes early if T034 exists | Low | High | Verify backend/src/sim-cards/ is empty |

All risks low.
