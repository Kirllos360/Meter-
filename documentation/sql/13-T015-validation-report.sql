-- T015 Validation Report SQL
-- Verifies: Reading, ReadingReview, TariffPlan, BillingPeriod
-- Run against: meter_pulse database, sim_system schema

-- 1. Verify all 4 tables exist
SELECT 'Table check' as check_name, tablename
FROM pg_tables
WHERE schemaname = 'sim_system'
  AND tablename IN ('readings', 'reading_reviews', 'tariff_plans', 'billing_periods')
ORDER BY tablename;

-- 2. Verify unique indexes
SELECT 'Index check' as check_name, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'sim_system'
  AND indexname IN ('readings_meter_id_reading_at_source_key', 'billing_periods_project_id_period_code_key');

-- 3. Verify DECIMAL(12,3) precision on tariff_plans
SELECT 'Decimal precision check' as check_name, column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_schema = 'sim_system'
  AND table_name = 'tariff_plans'
  AND column_name = 'rate_per_unit';

-- 4. Verify JSONB on readings
SELECT 'JSONB check' as check_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'sim_system'
  AND table_name = 'readings'
  AND column_name = 'raw_payload';

-- 5. Verify all enums exist
SELECT 'Enum check' as check_name, t.typname as enum_name
FROM pg_type t
JOIN pg_catalog.pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'sim_system'
  AND t.typname IN ('reading_source', 'reading_status', 'review_action', 'tariff_status', 'billing_period_status')
ORDER BY t.typname;

-- 6. Verify migration tracking
SELECT 'Migration check' as check_name, migration_name, started_at, finished_at
FROM sim_system._prisma_migrations
ORDER BY started_at;
