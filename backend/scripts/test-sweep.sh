#!/bin/sh
# Systematic Test Sweep: T001–T048
# Usage: ./scripts/test-sweep.sh [--verbose]
# Runs tests grouped by task, logs results with error codes.
# Exits 0 only if ALL tests pass.

set -e

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR"

LOG_DIR="$BASE_DIR/test-sweep-logs"
mkdir -p "$LOG_DIR"
SWEEP_LOG="$LOG_DIR/sweep-$(date -u '+%Y%m%d-%H%M%S').log"
ALERT_SCRIPT="$BASE_DIR/scripts/alert.sh"
ALL_PASS=true
VERBOSE=false

if [ "$1" = "--verbose" ]; then VERBOSE=true; fi

log() {
  echo "[SWEEP] $*" | tee -a "$SWEEP_LOG"
}

run_task_tests() {
  local task_id="$1"
  local description="$2"
  local test_pattern="$3"
  local error_code="$4"
  local log_file="$LOG_DIR/${task_id}-$(date -u '+%Y%m%d-%H%M%S').log"

  log "=== $task_id: $description ==="
  log "  Pattern: npx jest $test_pattern --no-coverage --verbose"

  if npx jest "$test_pattern" --no-coverage --verbose > "$log_file" 2>&1; then
    local passes
    passes=$(grep -c '✓' "$log_file" 2>/dev/null || echo "?")
    log "  ${GREEN}PASS${NC} ($passes tests passed)"
    return 0
  else
    log "  ${RED}FAIL${NC} — see $log_file"
    ALL_PASS=false
    if [ -n "$error_code" ]; then
      bash "$ALERT_SCRIPT" "$error_code" "Failed: $description" --admin
    fi
    if [ "$VERBOSE" = true ]; then
      tail -20 "$log_file"
    fi
    return 1
  fi
}

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "=== Systematic Test Sweep: T001–T048 ===" | tee "$SWEEP_LOG"
echo "Started: $(date -u '+%Y-%m-%d %H:%M:%S UTC')" | tee -a "$SWEEP_LOG"
echo "" | tee -a "$SWEEP_LOG"

# ─── Auth / Foundational (T005, T006, T026, T027, T028) ───
run_task_tests "T005" "Authentication & JWT" "test/auth/" "ERR-AUTH-001"
run_task_tests "T006" "Roles Guard" "test/auth/roles.guard.spec.ts" ""
run_task_tests "T026" "JWT Strategy validation" "test/auth/jwt.strategy.spec.ts" ""
run_task_tests "T027" "RolesDecorator" "test/auth/roles.decorator.spec.ts" ""
run_task_tests "T028" "ErrorEnvelope" "test/error-envelope.spec.ts" ""

# ─── Audit (T022, T023) ───
run_task_tests "T022" "Audit Service + Decorator" "test/audit/audit.service.spec.ts test/audit/audit.decorator.spec.ts" ""
run_task_tests "T023" "Audit Interceptor" "test/audit/audit.interceptor.spec.ts" ""

# ─── Idempotency (T024) ───
run_task_tests "T024" "Idempotency" "test/idempotency.spec.ts" ""

# ─── Correlation (part of T023) ───
run_task_tests "T023b" "Correlation Middleware" "test/correlation.spec.ts" ""

# ─── Project CRUD (T010) ───
run_task_tests "T010" "Project CRUD" "test/unit/projects/projects.controller.spec.ts test/unit/projects/projects.service.spec.ts" ""

# ─── Location CRUD (T042, T043) ───
run_task_tests "T042" "Location CRUD" "test/unit/projects/locations/" ""

# ─── Customer CRUD (T007) ───
run_task_tests "T007" "Customer CRUD" "test/unit/customers/" ""

# ─── Meter CRUD (T008, T011) ───
run_task_tests "T008" "Meter CRUD" "test/unit/meters/" ""

# ─── SIM Card CRUD (T009) ───
run_task_tests "T009" "SIM Card CRUD" "test/unit/sim-cards/" ""

# ─── Dashboard (T037, T038, T039) ───
run_task_tests "T037" "Dashboard KPIs" "test/unit/projects/dashboard/" ""

# ─── Thresholds (T040, T041, T044) ───
run_task_tests "T040" "Threshold Service" "test/unit/projects/thresholds/" ""

# ─── Readings Service (T016, T017, T018) ───
run_task_tests "T016" "Reading service validation" "test/unit/readings/readings.service.spec.ts" ""

# ─── Reading Validation Integration (T045, T046) ───
run_task_tests "T045" "Reading validation integration" "test/integration/reading-validation.spec.ts" "ERR-T045-001"

# ─── SIM Reuse Integration (T036) ───
run_task_tests "T036" "SIM Reuse lifecycle" "test/integration/sim-reuse.spec.ts" ""

# ─── Contract Tests ───
run_task_tests "T002" "Contract harness + health" "test/contract/setup.spec.ts" ""
run_task_tests "T029" "SIM Eligibility contract" "test/contract/sim-eligibility.contract.spec.ts" ""
run_task_tests "T030" "Meter Assign contract" "test/contract/meter-assign.contract.spec.ts" ""
run_task_tests "T033" "Meter Terminate contract" "test/contract/meter-terminate.contract.spec.ts" ""
run_task_tests "T047" "Reading Create contract" "test/contract/reading-create.contract.spec.ts" "ERR-P2002-001"
run_task_tests "T048" "Review Queue contract" "test/contract/reading-review-queue.contract.spec.ts" "ERR-T048-001"
run_task_tests "T053" "Invoice Generate contract" "test/contract/invoice-generate.contract.spec.ts" ""
run_task_tests "T054" "Invoice Issue + Adjustment contract" "test/contract/invoice-issue.contract.spec.ts test/contract/invoice-adjustment.contract.spec.ts" ""

# ─── Full suite (final verification) ───
log ""
log "=== Final: Full test suite ==="
if npx jest --no-coverage --verbose > "$LOG_DIR/full-suite.log" 2>&1; then
  total=$(grep -c '✓' "$LOG_DIR/full-suite.log" 2>/dev/null || echo "?")
  suites=$(grep 'Test Suites:' "$LOG_DIR/full-suite.log" 2>/dev/null || echo "")
  log "${GREEN}PASS${NC} — Full suite: $total tests, $suites"
else
  log "${RED}FAIL${NC} — Full suite has failures"
  ALL_PASS=false
  bash "$ALERT_SCRIPT" "ERR-TEST-001" "Full test suite has failures" --admin
fi

echo "" | tee -a "$SWEEP_LOG"
echo "=== Sweep Complete ===" | tee -a "$SWEEP_LOG"
echo "Log: $SWEEP_LOG" | tee -a "$SWEEP_LOG"
echo "Individual logs: $LOG_DIR/" | tee -a "$SWEEP_LOG"

if [ "$ALL_PASS" = true ]; then
  echo "${GREEN}ALL T001–T048: PASS${NC}" | tee -a "$SWEEP_LOG"
  exit 0
else
  echo "${RED}SOME T001–T048: FAIL${NC}" | tee -a "$SWEEP_LOG"
  exit 1
fi
