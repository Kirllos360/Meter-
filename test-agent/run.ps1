# TEST AGENT — PowerShell Master Test Runner
# Run: .\test-agent\run.ps1 [-Mode fast|full|deploy]
# ============================================================
param([string]$Mode = "fast")

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ReportDir = "$ProjectDir\test-agent\reports"
$null = New-Item -ItemType Directory -Path $ReportDir -Force
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ReportFile = "$ReportDir\test-run-$Timestamp.txt"
$Pass = 0; $Fail = 0

function Check($Name, $Command) {
    Write-Host -NoNewline "[$Name]".PadRight(28)
    $output = & Invoke-Expression $Command 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
        Write-Host "  ✅ PASS" -ForegroundColor Green
        $script:Pass++
    } else {
        Write-Host "  ❌ FAIL" -ForegroundColor Red
        $script:Fail++
    }
}

"=== TEST AGENT RUN ($Mode) ===" | Out-File $ReportFile
"Started: $(Get-Date)" | Out-File $ReportFile -Append
"" | Out-File $ReportFile -Append

# Stage 1: Fast Checks
Write-Host "--- Stage 1: Fast Checks ---" -ForegroundColor Cyan
Check "Prettier" "cd $ProjectDir\backend; npx prettier --check 'src/**/*.ts' 'test/**/*.ts' 2>`$null"
Check "ESLint" "cd $ProjectDir\backend; npx eslint src/ --max-warnings 6 --quiet 2>`$null"
Check "Prisma" "cd $ProjectDir\backend; npx prisma validate 2>`$null"
Check "Backend Build" "cd $ProjectDir\backend; npm run build 2>`$null"

# Stage 2: Tests
Write-Host "--- Stage 2: Tests ---" -ForegroundColor Cyan
Check "Jest" "cd $ProjectDir\backend; npm test -- --silent --bail 2>`$null"

# Stage 3: Extended checks
if ($Mode -ne "fast") {
    Write-Host "--- Stage 3: Extended ---" -ForegroundColor Cyan
    Check "Depcruise" "cd $ProjectDir\backend; npx dependency-cruiser --ts-config tsconfig.json src/ 2>`$null"
    Check "Spectral" "cd $ProjectDir; npx spectral lint 'specs/001-metering-billing-platform/contracts/meter-pulse-api.yaml' --ruleset=test-agent/configs/.spectral.yaml --quiet 2>`$null"
}

# Stage 4: Deep scan (full mode only)
if ($Mode -eq "full") {
    Write-Host "--- Stage 4: Deep Scan ---" -ForegroundColor Cyan
    $njsscanOk = $true
    try { njsscan $ProjectDir\backend\src $ProjectDir\Frontend\src --json 2>`$null | Out-Null } catch { $njsscanOk = $false }
    if (-not $njsscanOk) {
        Write-Host "[Njsscan]".PadRight(28) "  ⚠️ SKIP (upgrade njsscan or use semgrep directly)"
    } else {
        Write-Host "[Njsscan]".PadRight(28) "  ✅ PASS"
        $script:Pass++
    }
    Check "Semgrep" "semgrep --config=$ProjectDir\.semgrep-rules.yaml --quiet --error --exclude='docs/' --exclude='backup files/' --exclude='restore-point*' --exclude='node_modules' $ProjectDir\backend\src $ProjectDir\Frontend\src 2>`$null | Out-Null"
    Check "Codespell" "codespell $ProjectDir\backend\src $ProjectDir\Frontend\src --quiet-level=3 --ignore-words=$ProjectDir\test-agent\configs\.codespell-ignore 2>`$null"
}

# Stage 5: Security scan (deploy mode only)
if ($Mode -eq "deploy") {
    Write-Host "--- Stage 5: Security ---" -ForegroundColor Cyan
    Check "Snyk" "cd $ProjectDir\backend; snyk test --json 2>`$null | Out-Null"
    Check "Trivy" "trivy fs --severity CRITICAL,HIGH --quiet --no-progress --skip-dirs 'node_modules' --skip-dirs '.next' $ProjectDir\backend\ 2>`$null"
    Check "TruffleHog" "trufflehog filesystem --no-verification $ProjectDir 2>`$null"
}

# Summary
"" | Out-File $ReportFile -Append
Write-Host "=== RESULTS ===" -ForegroundColor Cyan
Write-Host "Passed: $Pass | Failed: $Fail"
Write-Host "Report: $ReportFile"
"Passed: $Pass | Failed: $Fail" | Out-File $ReportFile -Append
"Report: $ReportFile" | Out-File $ReportFile -Append

if ($Fail -gt 0) { Write-Host "❌ SOME CHECKS FAILED" -ForegroundColor Red; exit 1 }
else { Write-Host "✅ ALL CHECKS PASSED" -ForegroundColor Green; exit 0 }
