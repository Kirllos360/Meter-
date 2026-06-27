#!/bin/sh
# Backup State Script
# Usage: ./scripts/backup-state.sh [description]
# Creates a timestamped snapshot of the project state.

set -e

BASE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
RESTORE_BASE="$BASE_DIR/restore-points"
TIMESTAMP=$(date -u '+%Y%m%d-%H%M%S')
DESCRIPTION="${1:-manual-backup}"
BACKUP_DIR="$RESTORE_BASE/$TIMESTAMP-$DESCRIPTION"

echo "=== Backup State ==="
echo "Source: $BASE_DIR"
echo "Target: $BACKUP_DIR"
echo ""

mkdir -p "$BACKUP_DIR"

echo "[1/8] Saving git log..."
git -C "$BASE_DIR" log --oneline -30 > "$BACKUP_DIR/git-log.txt" 2>&1

echo "[2/8] Saving git diff..."
git -C "$BASE_DIR" diff --stat > "$BACKUP_DIR/git-diff-stat.txt" 2>&1

echo "[3/8] Running test suite..."
cd "$BASE_DIR/backend"
npx jest --no-coverage --verbose > "$BACKUP_DIR/test-output.txt" 2>&1 || true

echo "[4/8] Running build..."
npx nest build > "$BACKUP_DIR/build-output.txt" 2>&1 || true

echo "[5/8] Copying source files..."
mkdir -p "$BACKUP_DIR/backend/src"
cp -r "$BASE_DIR/backend/src/"* "$BACKUP_DIR/backend/src/" 2>/dev/null || true

echo "[6/8] Copying test files..."
mkdir -p "$BACKUP_DIR/backend/test"
cp -r "$BASE_DIR/backend/test/"* "$BACKUP_DIR/backend/test/" 2>/dev/null || true

echo "[7/8] Copying spec files..."
mkdir -p "$BACKUP_DIR/specs"
cp -r "$BASE_DIR/specs/"* "$BACKUP_DIR/specs/" 2>/dev/null || true

echo "[8/8] Writing restore manifest..."
cat > "$BACKUP_DIR/RESTORE.md" << EOF
# Restore Point: $DESCRIPTION
**Created**: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
**Previous state**: See test-output.txt for test results.

## To restore
1. Copy backend/src/ back: \`cp -r src/* \$PROJECT_DIR/backend/src/\`
2. Copy test/ back: \`cp -r test/* \$PROJECT_DIR/backend/test/\`
3. Copy specs/ back: \`cp -r specs/* \$PROJECT_DIR/specs/\`
4. Run \`npm install\`, \`npx prisma generate\`, \`npm test\`
EOF

echo ""
echo "Backup complete: $BACKUP_DIR"
ls -la "$BACKUP_DIR/"
