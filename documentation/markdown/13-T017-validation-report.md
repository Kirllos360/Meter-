# T017 Validation Report — Payment, PaymentAllocation, CustomerLedgerEntry

**Date**: 2026-05-27
**Branch**: `feature/t017-payments-ledger-migration`

## Summary

Created 3 Prisma models (Payment, PaymentAllocation, CustomerLedgerEntry) + 4 enums. Migration creates 3 tables, 4 enum types, 1 unique index, + DB-level append-only trigger.

## Models Added

| Model | Table | Key Features |
|-------|-------|-------------|
| Payment | `payments` | unique payment_number, PaymentMethod enum, PaymentStatus enum, DECIMAL(12,3) amount |
| PaymentAllocation | `payment_allocations` | FK to payment → invoice, allocation_order, DECIMAL(12,3) allocated_amount |
| CustomerLedgerEntry | `customer_ledger_entries` | append-only (DB trigger), running_balance, DECIMAL(12,3), entry_type/reference_type enums |

## Append-Only Protection

- DB-level `BEFORE UPDATE OR DELETE` trigger `trg_customer_ledger_append_only`
- Function `block_ledger_modification()` raises exception
- **UPDATE blocked** ✅ (verified)
- **DELETE blocked** ✅ (verified)
- **INSERT allowed** ✅ (verified)

## Enums Added

- `payment_method`: cash, bank_transfer, card, online, cheque, wallet
- `payment_status`: pending, confirmed, reversed, cancelled
- `ledger_entry_type`: invoice_charge, adjustment_debit, adjustment_credit, payment_credit, payment_reversal
- `reference_type`: invoice, payment, adjustment

## Validation Results

| Check | Result |
|-------|--------|
| `npx prisma validate` | ✅ |
| `npx prisma migrate status` | ✅ (6 migrations, DB up-to-date) |
| `npx prisma generate` | ✅ |
| `npm run build` | ✅ |
| `npm test` | ✅ 69/69 (8 suites) |

## SQL Verification

- `payments_payment_number_key` — UNIQUE (payment_number) ✅
- All DECIMAL(12,3) on amount fields ✅
- 3 tables created ✅
- 4 enums created ✅

## Append-Only Verification

- UPDATE blocked by trigger ✅
- DELETE blocked by trigger ✅
- INSERT allowed ✅

## Regression: T014 Partial Indexes

- 3 partial indexes (end_at IS NULL) — all intact ✅

## Regression: T015

- readings unique index (meter_id, reading_at, source) ✅
- raw_payload JSONB ✅

## Regression: T016

- invoices_invoice_number_key unique ✅
- immutable_at nullable ✅
- DECIMAL(12,3) on invoice amounts ✅

## Risk Notes

- Append-only enforced at DB level via trigger (cannot be bypassed by application code)
- All monetary fields use consistent DECIMAL(12,3)
- FKs are scalar fields (dependent models not merged on this branch)
- Rollback: DROP tables + DROP types + DROP function + DROP trigger
