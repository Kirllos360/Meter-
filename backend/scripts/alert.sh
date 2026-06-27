#!/bin/sh
# Alert System
# Usage: ./scripts/alert.sh <error-code> ["description"] [--admin]
#   --admin: escalate to admin contact
# Exits 0 after logging alert.

set -e

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ALERT_LOG="$BASE_DIR/alerts.log"
TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
ERROR_CODE="${1:?Usage: alert.sh <error-code> [description] [--admin]}"
DESCRIPTION="${2:-No description provided}"
ESCALATE=false

for arg in "$@"; do
  if [ "$arg" = "--admin" ]; then ESCALATE=true; fi
done

# Registry of known error codes
KNOWN_CODES=$(cat <<'REGISTRY'
ERR-T048-001|Review queue GET returns non-200 status
ERR-T045-001|UUID format mismatch in reading validation
ERR-T045-002|Class-validator rejects valid UUID v4
ERR-P2002-001|Prisma unique constraint not caught as 422
ERR-AUTH-001|JWT validation rejects valid token
ERR-BUILD-001|npm run build compilation failure
ERR-LINT-001|ESLint violation found
ERR-TEST-001|Test suite failure during sweep
ERR-TEST-002|Contract test HTTP endpoint failure
ERR-GENERIC-001|Unspecified failure point
REGISTRY
)

MATCH=$(echo "$KNOWN_CODES" | grep "^$ERROR_CODE|" | head -1)
if [ -z "$MATCH" ]; then
  EXPLANATION="Unknown error code — see registry in alert.sh"
else
  EXPLANATION=$(echo "$MATCH" | cut -d'|' -f2)
fi

ALERT_ENTRY="$TIMESTAMP [$ERROR_CODE] $EXPLANATION — $DESCRIPTION"

if [ "$ESCALATE" = true ]; then
  ALERT_ENTRY="$ALERT_ENTRY [ESCALATED TO ADMIN]"
fi

echo "$ALERT_ENTRY" >> "$ALERT_LOG"

# Output for machine parsing
echo "ALERT:$ERROR_CODE"
echo "TIMESTAMP:$TIMESTAMP"
echo "EXPLANATION:$EXPLANATION"
echo "DESCRIPTION:$DESCRIPTION"
echo "ESCALATED:$ESCALATE"
echo "LOG:$ALERT_LOG"

if [ "$ESCALATE" = true ]; then
  echo "[ALERT] Escalating $ERROR_CODE to project admin. Full context in $ALERT_LOG" >&2
fi

exit 0
