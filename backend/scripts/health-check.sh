#!/bin/sh
# Health Check Script
# Usage: ./scripts/health-check.sh [--verbose]
# Returns 0 if all checks pass, non-zero otherwise.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR"

ALL_PASS=true
VERBOSE=false

if [ "$1" = "--verbose" ]; then VERBOSE=true; fi

check() {
  local name="$1"
  local cmd="$2"
  echo -n "[HEALTH] $name ... "
  if eval "$cmd" > /tmp/health-check.log 2>&1; then
    echo "${GREEN}PASS${NC}"
    return 0
  else
    echo "${RED}FAIL${NC}"
    ALL_PASS=false
    if [ "$VERBOSE" = true ]; then
      echo "  Output:"
      sed 's/^/  /' /tmp/health-check.log
    fi
    return 1
  fi
}

echo "=== Meter Health Check ==="
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "Backend dir: $BASE_DIR"
echo ""

check "Node modules exist" "test -d node_modules"
check "Prisma client generated" "test -d node_modules/.prisma/client"
check "npm test (unit+integration)" "npx jest --no-coverage --passWithNoTests --testPathPattern='test/(unit|integration)' 2>&1 | tail -5"
check "npm run build" "npx nest build 2>&1"
check "ESLint" "npx eslint src test --ext .ts --max-warnings 0 2>&1"
check "Prettier" "npx prettier --check 'src/**/*.ts' 'test/**/*.ts' 2>&1"
check "Prisma validate" "npx prisma validate 2>&1"
check "OpenAPI spec loads" "node -e \"const y=require('js-yaml'),fs=require('fs');y.load(fs.readFileSync('../specs/001-metering-billing-platform/openapi.yaml','utf8'));console.log('OK');\" 2>&1"

echo ""
if [ "$ALL_PASS" = true ]; then
  echo "${GREEN}All health checks passed.${NC}"
  exit 0
else
  echo "${RED}Some health checks failed.${NC}"
  echo "Run with --verbose to see failure details."
  exit 1
fi
