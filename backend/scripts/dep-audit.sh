#!/usr/bin/env bash
set -euo pipefail

# Dependency audit script
# Run: bash scripts/dep-audit.sh
# Outputs: dep-audit-report.json, dep-audit-summary.txt

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

REPORT_DIR="${REPORT_DIR:-$PROJECT_DIR}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "[AUDIT] Running npm audit..."
npm audit --json > "$REPORT_DIR/dep-audit-report-$TIMESTAMP.json" 2>/dev/null || true

echo "[AUDIT] Generating summary..."
node -e "
const r = require('$REPORT_DIR/dep-audit-report-$TIMESTAMP.json');
const summary = {
  total: r.metadata?.vulnerabilities?.total ?? 0,
  critical: r.metadata?.vulnerabilities?.critical ?? 0,
  high: r.metadata?.vulnerabilities?.high ?? 0,
  moderate: r.metadata?.vulnerabilities?.moderate ?? 0,
  low: r.metadata?.vulnerabilities?.low ?? 0,
  info: r.metadata?.vulnerabilities?.info ?? 0,
  timestamp: '$TIMESTAMP'
};
require('fs').writeFileSync('$REPORT_DIR/dep-audit-summary-$TIMESTAMP.json', JSON.stringify(summary, null, 2));
console.log('Vulnerabilities:', summary.total, '(' + summary.critical + ' critical, ' + summary.high + ' high, ' + summary.moderate + ' moderate, ' + summary.low + ' low)');
"

echo "[AUDIT] Done: $REPORT_DIR/dep-audit-report-$TIMESTAMP.json"
