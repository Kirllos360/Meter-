# Task Analysis Report — T025

## 1. Task ID
**T025** — US1 Contract Tests: `simEligibility`

## 2. User Story
User Story 1 — Manage Meter and Location Assignments. Contract test for `GET /sim-cards/{simId}/eligibility` — validates SimEligibility schema. TDD: fail first, pass after implementation.

## 3. Acceptance Criteria
1. Validate `SimEligibility` response schema (simId, eligible, reason, cooldownUntil nullable)
2. HTTP GET request to `/api/v1/sim-cards/{simId}/eligibility` — fails (404) because endpoint doesn't exist
3. All schema-level assertions pass; HTTP assertions fail (TDD)
4. No existing tests broken

## 4. Files
| File | Purpose |
|---|---|
| `backend/test/contract/sim-eligibility.contract.spec.ts` | Contract test for getSimEligibility |
