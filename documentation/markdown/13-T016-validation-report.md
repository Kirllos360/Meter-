# T016 Validation Report — Invoice, InvoiceLine, InvoiceAdjustment

**Date**: 2026-05-27
**Branch**: `feature/t016-invoices-migration`
**Commit**: (pending)

## Summary

Created 3 Prisma models (Invoice, InvoiceLine, InvoiceAdjustment) + 3 enums. Migration creates 3 tables, 3 enum types, 1 unique index.

## Models Added

| Model | Table | Key Features |
|-------|-------|-------------|
| Invoice | `invoices` | unique invoice_number, utility_type enum, status enum, 5 amount columns (DECIMAL(12,3)), immutable_at |
| InvoiceLine | `invoice_lines` | FK to invoice, nullable reading_id, DECIMAL(12,3) quantity/unit_price/line_amount |
| InvoiceAdjustment | `invoice_adjustments` | FK to invoice, adjustment_type enum, DECIMAL(12,3) amount, approved_by nullable |

## Enums Added

- `utility_type`: electricity, water
- `invoice_status`: draft, pending_approval, issued, partially_paid, paid, overdue, cancelled
- `adjustment_type`: credit, debit

## Migration SQL

- **File**: `backend/prisma/migrations/20260527153119_invoices/migration.sql`
- **No duplicate DDL**: Only T016 tables, no audit_log or previous migration duplication

## Validation Results

| Check | Result |
|-------|--------|
| `npx prisma validate` | ✅ |
| `npx prisma migrate status` | ✅ (5 migrations, DB up-to-date) |
| `npx prisma generate` | ✅ |
| `npm run build` | ✅ |
| `npm test` | ✅ 69/69 (8 suites) |

## SQL Verification

- `invoices_invoice_number_key` — UNIQUE (invoice_number) ✅
- All DECIMAL(12,3) on all 9 amount columns across 3 tables ✅
- `immutable_at` — nullable timestamp present ✅
- `utility_type`, `invoice_status`, `adjustment_type` enums created ✅
- All 3 tables in `sim_system` schema ✅

## Regression: T014 Partial Indexes

- `customer_unit_assignments` partial index (end_at IS NULL) ✅
- `meter_assignments` partial index (end_at IS NULL) ✅
- `sim_assignments` partial index (end_at IS NULL) ✅

## Regression: T015

- `readings_meter_id_reading_at_source_key` unique index ✅
- `raw_payload` JSONB ✅

## Risk Notes

- Shadow database unreachable — migration SQL crafted manually
- All FKs are scalar fields (no Prisma `@relation`) — dependent models not merged on this branch
- Decimal precision consistent: 12,3 across all invoice/line/adjustment fields
- No audit_log / previous migration duplication
