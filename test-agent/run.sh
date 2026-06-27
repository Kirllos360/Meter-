#!/usr/bin/env bash
# ============================================================
# TEST AGENT — Master Test Runner
# Run: bash test-agent/run.sh [--fast|--full|--deploy|--ci]
# ============================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

MODE="${1:-fast}"
PASS=0
FAIL=0
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT="$SCRIPT_DIR/reports/test-run-$TIMESTAMP.txt"

check() {
    local name="$1" cmd="$2"
    printf "%-25s " "[$name]"
    if eval "$cmd" 2>/dev/null; then
        echo "  ✅ PASS"
        PASS=$((PASS + 1))
    else
        echo "  ❌ FAIL"
        FAIL=$((FAIL + 1))
    fi
}

echo "=== TEST AGENT RUN ($MODE) ===" | tee "$REPORT"
echo "Started: $(date)" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

# === STAGE 1: FAST CHECKS (always run) ===
echo "--- Stage 1: Fast Checks ---" | tee -a "$REPORT"
check "Prettier" "cd backend && npx prettier --check 'src/**/*.ts' 'test/**/*.ts' --loglevel error 2>/dev/null"
check "ESLint" "cd backend && npx eslint src/ --max-warnings 0 --quiet 2>/dev/null"
check "Frontend Lint" "cd Frontend && bun run lint --no-cache --max-warnings 0 2>/dev/null"
check "Prisma Validate" "cd backend && npx prisma validate 2>/dev/null"
check "Backend Build" "cd backend && npm run build 2>/dev/null"
check "Frontend Build" "cd Frontend && bun run build 2>/dev/null"

# === STAGE 2: TESTS ===
echo "--- Stage 2: Tests ---" | tee -a "$REPORT"
check "Jest Tests" "cd backend && npm test -- --silent --bail 2>/dev/null"

# === STAGE 3: DEPENDENCY CHECKS ===
if [ "$MODE" != "fast" ]; then
    echo "--- Stage 3: Dependency Checks ---" | tee -a "$REPORT"
    check "Depcruise" "cd backend && npx depcruise --ts-config tsconfig.json src/ 2>/dev/null"
    check "Semgrep" "cd $PROJECT_DIR && semgrep --config=test-agent/configs/.semgrep-rules.yaml --quiet --error --exclude='docs/' --exclude='backup files/' --exclude='restore-point*' --exclude='node_modules' 2>/dev/null"
    check "Spectral" "npx spectral lint specs/001-metering-billing-platform/contracts/meter-pulse-api.yaml --ruleset=test-agent/configs/.spectral.yaml --quiet 2>/dev/null"
fi

# === STAGE 4: FULL SCAN (deploy mode only) ===
if [ "$MODE" = "deploy" ] || [ "$MODE" = "ci" ]; then
    echo "--- Stage 4: Full Scan ---" | tee -a "$REPORT"
    check "Trivy Backend" "trivy fs --severity CRITICAL,HIGH --quiet --no-progress --skip-dirs 'node_modules' --skip-dirs '.next' --skip-dirs 'dist' backend/ 2>/dev/null"
    check "TruffleHog" "trufflehog filesystem --no-verification . 2>/dev/null"
fi

# === STAGE 5: GRAPHIFY (ci mode only) ===
if [ "$MODE" = "ci" ]; then
    echo "--- Stage 5: Graphify ---" | tee -a "$REPORT"
    echo "Skipping graphify in CI (run manually: graphify update .)" | tee -a "$REPORT"
fi

# === SUMMARY ===
echo "" | tee -a "$REPORT"
echo "=== RESULTS ===" | tee -a "$REPORT"
echo "Passed: $PASS | Failed: $FAIL" | tee -a "$REPORT"
echo "Report: $REPORT" | tee -a "$REPORT"

if [ "$FAIL" -gt 0 ]; then
    echo "❌ SOME CHECKS FAILED" | tee -a "$REPORT"
    exit 1
else
    echo "✅ ALL CHECKS PASSED" | tee -a "$REPORT"
    exit 0
fi
