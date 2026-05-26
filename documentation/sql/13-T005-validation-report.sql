-- ============================================================================
-- T005 Validation Report - Docker PostgreSQL
-- SQL-based validation: database connectivity and schema checks
-- ============================================================================
-- Task: T005 [P] Add local PostgreSQL via docker-compose
-- Date: 2026-05-26
-- Verdict: PASS

-- 1. Verify database connection
SELECT current_database() AS database_name,
       current_user AS connected_user;

-- 2. Verify sim_system schema exists
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'sim_system';

-- 3. Verify PostgreSQL version
SELECT version() AS postgres_version;
-- ============================================================================
