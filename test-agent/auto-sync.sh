#!/usr/bin/env bash
# AUTO-SYNC: Run after EVERY completed task
# Usage: bash test-agent/auto-sync.sh "TASK-ID: description"
# This automates: test → build → docs → git → github → onedrive

set -euo pipefail
TASK="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "=== AUTO-SYNC: $TASK ==="

# 1. Run validation
echo "[1/7] Running tests..."
cd backend && npm test -- --silent --bail || exit 1
cd ..

# 2. Build
echo "[2/7] Building..."
cd backend && npm run build || exit 1
cd ..
cd Frontend && bun run build || exit 1
cd ..

# 3. Update documentation
echo "[3/7] Updating docs..."
# (placeholder - update relevant docs based on TASK)

# 4. Git commit
echo "[4/7] Committing..."
git add -A
git commit -m "$TASK"

# 5. Push to Kirllos360
echo "[5/7] Pushing to Kirllos360..."
git push origin feature/t054-sw-checkpoint

# 6. Update PR on Abady001 (auto-updates via branch)
echo "[6/7] PR #25 auto-updated on Abady001/Meter-"

# 7. OneDrive sync
echo "[7/7] OneDrive sync..."
# Uncomment and adjust path:
# Copy-Item -Recurse -Path "D:\meter\Meter-\*" -Destination "$env:OneDrive\Projects\Meter Pulse\meter-\" -Exclude "node_modules",".next","dist","graphify-out/cache"

echo "=== DONE: $TASK ==="
