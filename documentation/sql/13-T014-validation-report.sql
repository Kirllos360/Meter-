-- ============================================================================
-- T014 Validation Report — Migration: Meter, SIMCard, MeterAssignment, SIMAssignment
-- SQL-based validation queries for schema verification
-- ============================================================================
-- Task: T014 — Meter, SIMCard, MeterAssignment, SIMAssignment migrations
-- Date: 2026-05-27
-- Verdict: PASS
-- ============================================================================

-- 1. Verify all 5 enums exist
SELECT typname AS enum_name
FROM pg_type
WHERE typname IN ('meter_type', 'meter_status', 'ip_type', 'sim_status', 'assignment_status')
ORDER BY typname;

-- 2. Verify all 4 tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'sim_system'
  AND tablename IN ('meters', 'sim_cards', 'meter_assignments', 'sim_assignments')
ORDER BY tablename;

-- 3. Verify unique indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'sim_system'
  AND indexname IN ('meters_serial_number_key', 'sim_cards_iccid_key');

-- 4. Verify partial unique indexes (FR-004 / FR-005)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'sim_system'
  AND tablename IN ('meter_assignments', 'sim_assignments')
  AND indexdef LIKE '%WHERE%';

-- 5. Verify FK constraints
SELECT conname AS constraint_name, conrelid::regclass::text AS table_name
FROM pg_constraint
WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sim_system')
  AND contype = 'f'
  AND conrelid::regclass::text IN ('meters', 'sim_cards', 'meter_assignments', 'sim_assignments')
ORDER BY conname;

-- ============================================================================
-- Expected Results:
--   1. Five enums: meter_type, meter_status, ip_type, sim_status, assignment_status
--   2. Four tables: meters, sim_cards, meter_assignments, sim_assignments
--   3. Two unique indexes: meters_serial_number_key, sim_cards_iccid_key
--   4. Two partial unique indexes: meter_assignments_meter_id_active_key,
--      sim_assignments_sim_id_active_key
--   5. Four FK constraints: meters_parent_main_meter_id_fkey,
--      meter_assignments_meter_id_fkey, sim_assignments_sim_id_fkey,
--      sim_assignments_meter_id_fkey
-- ============================================================================
