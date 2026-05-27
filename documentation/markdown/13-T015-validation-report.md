# T015 Validation Report — Readings, Tariffs, Billing Periods

**Date**: 2026-05-27
**Branch**: `feature/t015-readings-tariff-migration`
**Commit**: c8c86aa

## Summary

Created 4 Prisma models (Reading, ReadingReview, TariffPlan, BillingPeriod) + 6 enums. Migration creates 4 tables, 5 enum types, 2 unique indexes.

## Models Added

| Model | Table | Key Features |
|-------|-------|-------------|
| Reading | `readings` | unique(meter_id, reading_at, source), raw_payload JSONB, status enum, DECIMAL(12,3) |
| ReadingReview | `reading_reviews` | review_action enum, reviewer tracking |
| TariffPlan | `tariff_plans` | MeterType enum ref, DECIMAL(12,3) rate_per_unit, effective window |
| BillingPeriod | `billing_periods` | unique(project_id, period_code), lifecycle status |

## Enums Added

- `reading_source`: manual, import, automatic
- `reading_status`: valid, pending_review, estimated, suspicious, corrected, rejected
- `review_action`: approve, reject, correct
- `tariff_status`: draft, active, retired
- `billing_period_status`: open, in_review, closed
- `meter_type`: electricity, water_main, water_child (reference only — created by T014)

## Migration SQL

- **File**: `backend/prisma/migrations/20260527114543_readings_tariff/migration.sql`
- **No duplicate DDL**: No duplicate CREATE TABLE for audit_log, projects, customers, etc.
- **No duplicate CREATE TYPE**: meter_type not re-created (exists from T014)

## Validation Results

| Check | Result |
|-------|--------|
| `npx prisma validate` | ✅ |
| `npx prisma migrate status` | ✅ (4 migrations, DB up-to-date) |
| `npx prisma generate` | ✅ |
| `npm run build` | ✅ |
| `npm test` | ✅ 69/69 (8 suites) |

## SQL Verification

- `readings_meter_id_reading_at_source_key` — UNIQUE (meter_id, reading_at, source) ✅
- `billing_periods_project_id_period_code_key` — UNIQUE (project_id, period_code) ✅
- `raw_payload` — JSONB ✅
- `reading_value`, `previous_reading_value`, `consumption_value` — DECIMAL(12,3) ✅
- `rate_per_unit` — DECIMAL(12,3) ✅
- All 4 tables created in `sim_system` schema ✅

## Risk Notes

- Shadow database unreachable — migration SQL crafted manually
- T014 (MeterType enum) must merge before T015 (tariff_plans.meter_type references it)
- All FKs are scalar fields (no Prisma `@relation`) — T013/T014 not merged on this branch
- Migration folders for T008/T013/T014 included for history continuity
- AuditLog table created manually in dev DB (not in migration — already on main from T010)
