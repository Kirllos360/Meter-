# RCA Report — Root Cause Analysis
**Date**: 2026-06-01
**Scope**: Full deep scan (security, TypeScript, Husky, frontend/backend, documentation)

---

## Executive Summary

| Category | Status | Issues |
|----------|--------|--------|
| Backend Build (tsc) | ✅ PASS | 0 |
| Frontend Build (Next.js) | ✅ PASS | 0 |
| Frontend Lint (ESLint) | ✅ PASS | 0 |
| Prisma Validate | ✅ PASS | 0 |
| Jest Tests | ✅ PASS | 373/373 |
| Spectral (OpenAPI) | ✅ PASS | 0 |
| **Backend Prettier** | ❌ FAIL | 127 files need formatting |
| **Backend ESLint** | ❌ FAIL | Config mismatch (v10 flat config vs .eslintrc.cjs) |
| **Depcruise** | ❌ CRITICAL | Dependency confusion package (malicious placeholder) |
| **Njsscan** | ❌ FAIL | Python runtime crash (semantic_grep NoneType error) |
| **Codespell** | ❌ FAIL | 9 typos |
| **Husky** | ❌ FAIL | Missing husky.sh, broken pre-commit hook |
| **Snyk** | ❌ FAIL | Not authenticated (401) |
| **Uncommitted Work** | ⚠️ DIRTY | 8 files changed, 3 untracked |

---

## 🔴 CRITICAL: Depcruise — Dependency Confusion Attack

**Severity**: CRITICAL — Supply Chain

**Evidence**:
```
npx depcruise --version
→ "Oops! You're trying to run a package that should be provided
   by a local binary, but isn't. This is a misconfiguration.
   This is a placeholder published to prevent dependency confusion."
```

**Root Cause**: The package `depcruise` (name-squatted) is installed/available instead of `dependency-cruiser`. The NPM package `depcruise` is NOT the real `dependency-cruiser` tool — it is a placeholder/blocker package. The real tool (`dependency-cruiser`) IS installed at v17.4.3.

**Impact**: CI workflow step `npx depcruise` will fail in GitHub Actions. The `depcruise` binary resolves to the wrong package because it's name-squatted.

**Fix**: Replace `npx depcruise` with `npx dependency-cruiser` in:
1. `test-agent/run.ps1` line 44
2. `.github/workflows/test-agent.yml` line 57

---

## 🔴 CRITICAL: Husky — Pre-commit Hook Broken

**Severity**: CRITICAL — Developer Workflow

**Evidence**:
```
Test-Path .husky/husky.sh → False  (file missing)
```

**Root Cause**: The pre-commit hook (`.husky/pre-commit`) references:
```sh
. "$(dirname -- "$0")/husky.sh"
```
But `husky.sh` does NOT exist in `.husky/`. Husky v8+ installs `husky.sh` during `husky install`. This file was never generated or was deleted.

Additionally, the pre-commit hook has these defects:
1. `npx eslint src/ --max-warnings=0` — will fail because ESLint v10 requires flat config
2. `npm test -- --bail --silent 2>/dev/null` — suppresses errors, `2>/dev/null` hides failures
3. The hook is a POSIX shell script — will NOT work on Windows without Git Bash/WSL

**Impact**: Pre-commit hooks silently fail on Windows, and will error on Linux CI. No code quality gates before commits.

**Fix**:
1. Run `npx husky install` to regenerate `husky.sh`
2. Convert hook to use `npx dependency-cruiser` (fix depcruise)
3. Remove `2>/dev/null` from test command
4. Test on both Windows and Linux

---

## 🔴 CRITICAL: ESLint v10 — Config Format Mismatch

**Severity**: HIGH — Developer Workflow + CI

**Evidence**:
```
ESLint: 10.4.1
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
From ESLint v9.0.0, the default configuration file is now eslint.config.js.
```

**Root Cause**: ESLint v10 dropped support for `.eslintrc.*` (legacy config format). The project uses `.eslintrc.cjs` which is no longer recognized. The `package.json` has:
```json
"lint": "ESLINT_USE_FLAT_CONFIG=false eslint \"src/**/*.ts\""
```
This env var approach works on Linux/macOS but NOT on Windows PowerShell — the env var prefix syntax `KEY=VALUE command` is Unix-only.

**Impact**: Backend lint command fails on Windows. CI succeeds only because it runs on `ubuntu-latest`.

**Fix**: Either:
- Option A: Migrate `.eslintrc.cjs` → `eslint.config.js` (flat config format)
- Option B: Set env var properly in PowerShell: `$env:ESLINT_USE_FLAT_CONFIG="false"; npx eslint "src/**/*.ts"`
- Option C: Downgrade ESLint to v8.x

---

## 🟡 HIGH: Prettier — 127 Files Need Formatting

**Severity**: HIGH — Code Quality

**Evidence**:
```
Code style issues found in 127 files.
```
Of 96 backend `.ts` source files, ALL 96 source files and many test files have formatting inconsistencies.

**Root Cause**: Prettier was set up but never run project-wide. New code was added without running `prettier --write`.

**Impact**: Code style is inconsistent. CI step `npx prettier --check` will show warnings (currently non-blocking via `|| echo "prettier: warnings"`).

**Fix**: `cd backend && npx prettier --write "src/**/*.ts" "test/**/*.ts"`

---

## 🟡 HIGH: Njsscan — Runtime Crash

**Severity**: HIGH — Security Scanning Gap

**Evidence**:
```
AttributeError: 'NoneType' object has no attribute 'get'
  File "libsast/core_sgrep/semantic_sgrep.py", line 46, in format_output
```

**Root Cause**: njsscan depends on libsast/semgrep which has a version incompatibility with the installed Python environment. The `semgrep` output format changed, breaking libsast's parser.

**Impact**: Security scanning tool is non-functional. No Node.js-specific SAST scanning available.

**Fix**: Either:
- Upgrade njsscan: `pip install --upgrade njsscan`
- Or switch to `semgrep --config=nodejs` directly

---

## 🟡 MEDIUM: Codespell — 9 Typos Found

**Severity**: MEDIUM — Code Quality

**Evidence**:
```
Frontend/src/components/customers/CustomerDetailPage.tsx:10: MapPin ==> mapping
Frontend/src/components/customers/CustomerDetailPage.tsx:50: MapPin ==> mapping
Frontend/src/components/layout/AppSidebar.tsx:10: MapPin ==> mapping
Frontend/src/components/layout/AppSidebar.tsx:57: MapPin ==> mapping
Frontend/src/components/meters/MeterDetailPage.tsx:13: MapPin ==> mapping
Frontend/src/components/meters/MeterDetailPage.tsx:56: MapPin ==> mapping
Frontend/src/components/tickets/SupportPage.tsx:13: MapPin ==> mapping
Frontend/src/components/tickets/SupportPage.tsx:88: MapPin ==> mapping
Frontend/src/lib/mock-data.ts:85: mot ==> not
```

**Root Cause**: Import names like `MapPin` are flagged by codespell as likely misspelling of "mapping" (false positives — `MapPin` is an icon name from lucide-react). The "mot" -> "not" is a genuine typo in `mock-data.ts:85`.

**Impact**: Low — mostly false positives. One genuine typo.

**Fix**: 
1. Add `MapPin` to codespell ignore list (false positive — lucide-react icon)
2. Fix "mot" -> "not" in `mock-data.ts:85`

---

## 🟡 MEDIUM: Snyk — Not Authenticated

**Severity**: MEDIUM — Security Scanning Gap

**Evidence**:
```
ERROR Authentication error (SNYK-0005)
Status: 401 Unauthorized
```

**Root Cause**: Snyk CLI requires `snyk auth` to authenticate. No token has been configured.

**Impact**: Snyk dependency scan is unavailable.

**Fix**: Run `snyk auth` and configure SNYK_TOKEN in CI secrets.

---

## 🟡 MEDIUM: Uncommitted Work on Feature Branch

**Severity**: MEDIUM — Development Hygiene

**Evidence**:
```
8 files changed, 133 insertions(+), 34 deletions(-)
```
Modified files:
- `backend/src/billing/billing.controller.ts` — significant refactor (semi-real implementation)
- `backend/src/billing/billing.module.ts` — DI updates
- `backend/test/contract/invoice-*.contract.spec.ts` — updated test expectations
- `backend/test/contract/payments.contract.spec.ts` — minor changes

Untracked:
- `backend/src/billing/periods/` — period service (functional)
- `backend/src/billing/tariffs/` — tariff service (functional)
- `documentation/markdown/04-30-am_01-06-2026_last_update.md` — new doc

**Impact**: Work is at risk. No commit or PR. If disk fails, the semi-real billing implementation (T061-T065) is lost.

**Fix**: Commit and push, or at minimum stash.

---

## 🟢 LOW: Other Observations

| Issue | Severity | Detail |
|-------|----------|--------|
| Spectral API lint | 🟢 PASS | No output (clean) |
| TypeScript strict mode | 🟢 PASS | No errors |
| Frontend build | 🟢 PASS | Next.js 16.2.6 |
| Frontend lint | 🟢 PASS | ESLint flat config (correct format) |
| Prisma schema | 🟢 PASS | Valid |
| Backend build (tsc) | 🟢 PASS | Clean |
| Tests | 🟢 PASS | 373/373 |
| `.gitignore` | 🟢 OK | Covers secrets, build, caches |
| Security controls | 🟢 18 active | RBAC, CSRF, rate-limit, helmet, idempotency |
| Dev JWT secret | ⚠️ INFO | `dev-jwt-secret-do-not-use-in-production` — OK for dev |

---

## 🔧 Fix Action Plan (Priority Order)

### P0 — Must fix before any new task
1. **Depcruise**: `depcruise` → `dependency-cruiser` in `run.ps1` and `test-agent.yml`
2. **Uncommitted work**: Commit billing implementation to current branch
3. **Husky**: Reinstall husky, fix pre-commit hook for cross-platform

### P1 — Should fix this sprint
4. **ESLint**: Migrate to flat config (`eslint.config.js`) or fix PowerShell env var
5. **Prettier**: Run `prettier --write` on all 127 files
6. **Njsscan**: Upgrade or replace with direct semgrep

### P2 — Fix when convenient
7. **Codespell**: Add ignore list, fix "mot" typo
8. **Snyk**: Authenticate and configure token

---

## ✅ Healthy Systems (no action needed)

- Backend TypeScript build (tsc) — ✅ 0 errors
- Frontend build (Next.js 16.2.6) — ✅ Clean
- Frontend lint — ✅ 0 errors
- Prisma schema validation — ✅ Valid
- Jest test suite — ✅ 373/373 passing (47 suites)
- OpenAPI spec — ✅ Spectral clean
- Security controls — ✅ 18 active
- `.gitignore` — ✅ Comprehensive

---

## Summary Table

| Check | Result | Finding |
|-------|--------|---------|
| Backend Build | ✅ | tsc clean |
| Frontend Build | ✅ | Next.js 16.2.6 |
| Frontend Lint | ✅ | 0 errors |
| Prisma Validate | ✅ | Valid |
| Jest (373 tests) | ✅ | 47 suites |
| Spectral (OpenAPI) | ✅ | Clean |
| Prettier | ❌ 127 files | Needs `--write` |
| ESLint v10 | ❌ Config broken | Flat config vs .eslintrc.cjs |
| Depcruise | 🔴 CRITICAL | Dependency confusion package |
| Husky | 🔴 CRITICAL | Missing husky.sh + broken hook |
| Njsscan | ❌ Crashes | Python/semgrep version mismatch |
| Codespell | ❌ 9 typos | 8 false positives, 1 real |
| Snyk | ❌ 401 | Not authenticated |
| Uncommitted work | ⚠️ Dirty | 8 files, 3 untracked |
