# AUTO-SYNC: Run after EVERY completed task
# Usage: .\test-agent\auto-sync.ps1 "TASK-ID: description"
# This automates: test → build → docs → git → github → onedrive
# PIN THIS IN MEMORY: Run this after EVERY task completion.

param([string]$Task = "auto-sync")

Write-Host "=== AUTO-SYNC: $Task ===" -ForegroundColor Cyan

# 1. Run validation
Write-Host "[1/7] Running tests..." -ForegroundColor Yellow
cd D:\meter\Meter-\backend
npm test -- --silent --bail 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "❌ TESTS FAILED" -ForegroundColor Red; exit 1 }
Write-Host "✅ Tests pass" -ForegroundColor Green

# 2. Build
Write-Host "[2/7] Building..." -ForegroundColor Yellow
npm run build 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "❌ BUILD FAILED" -ForegroundColor Red; exit 1 }
Write-Host "✅ Build pass" -ForegroundColor Green

# 3. Update documentation (placeholder - add doc updates per task)
Write-Host "[3/7] Documentation ready for updates" -ForegroundColor Yellow

# 4. Git commit
Write-Host "[4/7] Committing..." -ForegroundColor Yellow
cd D:\meter\Meter-
git add -A
git commit -m "$Task"

# 5. Push to Kirllos360
Write-Host "[5/7] Pushing to Kirllos360..." -ForegroundColor Yellow
git push origin feature/t054-sw-checkpoint

# 6. PR #25 auto-updates on Abady001
Write-Host "[6/7] PR #25 auto-updated on Abady001/Meter-" -ForegroundColor Green
Write-Host "      https://github.com/Abady001/Meter-/pull/25" -ForegroundColor Green

# 7. OneDrive sync
Write-Host "[7/7] OneDrive..." -ForegroundColor Yellow
# Uncomment when OneDrive path is confirmed:
# Copy-Item -Recurse -Path "D:\meter\Meter-\*" -Destination "$env:OneDrive\Projects\Meter Pulse\meter-\" -Exclude "node_modules",".next","dist","graphify-out/cache"

Write-Host "=== DONE: $Task ===" -ForegroundColor Cyan
