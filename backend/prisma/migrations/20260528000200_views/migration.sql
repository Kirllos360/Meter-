-- T019: Derived Views
-- Dependencies: T014 (meter_sim), T017 (payments_ledger)
--
-- View #1: meter_assignment_active_view
--   Source: meter_assignments
--   Filter: end_at IS NULL (one active row per meter enforced by partial unique index)
--
-- View #2: sim_assignment_active_view
--   Source: sim_assignments
--   Filter: end_at IS NULL (one active row per SIM enforced by partial unique index)
--
-- View #3: customer_statement_view
--   Source: customer_ledger_entries
--   Derives debit/credit from signed amount_delta
--   Uses stored running_balance (append-only ledger)

CREATE OR REPLACE VIEW sim_system.meter_assignment_active_view AS
SELECT
    id            AS assignment_id,
    meter_id,
    unit_id,
    customer_id,
    start_at,
    created_by    AS assigned_by,
    created_at
FROM sim_system.meter_assignments
WHERE end_at IS NULL;

CREATE OR REPLACE VIEW sim_system.sim_assignment_active_view AS
SELECT
    id            AS assignment_id,
    sim_id,
    meter_id,
    start_at,
    created_by    AS assigned_by,
    created_at
FROM sim_system.sim_assignments
WHERE end_at IS NULL;

CREATE OR REPLACE VIEW sim_system.customer_statement_view AS
SELECT
    customer_id,
    id            AS ledger_entry_id,
    entry_at      AS entry_date,
    reference_type,
    reference_id,
    CASE WHEN amount_delta > 0 THEN amount_delta ELSE 0 END AS debit,
    CASE WHEN amount_delta < 0 THEN -amount_delta ELSE 0 END AS credit,
    running_balance
FROM sim_system.customer_ledger_entries
ORDER BY entry_at, id;
