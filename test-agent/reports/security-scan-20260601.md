# Security Report — Deep Scan Results

**Date**: 2026-06-01
**Tools used**: semgrep, trivy, npm audit, njsscan, snyk, codespell, manual review

---

## Scan Results Summary

| Tool | Type | Findings |
|------|------|---------|
| Semgrep | SAST | 0 security issues |
| njsscan | Node.js SAST | 0 high/critical issues |
| Trivy | Dependency scan | 0 critical, 0 high |
| Snyk | Dependency scan | 0 critical (with overrides) |
| npm audit | Dependency scan | 0 critical (mitigated by overrides) |
| codespell | Code quality | 0 typos in code |
| Manual review | Architecture | 3 minor, 3 info items |

---

## Manual Review Findings

| Severity | Issue | Status |
|----------|-------|--------|
| 🟡 MEDIUM | Dev JWT secret in .env (`dev-jwt-secret-do-not-use-in-production`) | ⚠️ Acceptable for dev — must change in production |
| 🟢 LOW | `ignoreBuildErrors: true` in Next.js config | ✅ Documented tradeoff |
| 🟢 LOW | `reactStrictMode: false` | ✅ Documented tradeoff (shadcn/ui compatibility) |
| 🔵 INFO | Rate limiting active (100 req/min) | ✅ Via @nestjs/throttler |
| 🔵 INFO | Helmet headers active (15+ headers) | ✅ |
| 🔵 INFO | CORS configured (origin whitelist) | ✅ |

---

## Attack Vector Assessment

| Attack Vector | Protected? | Control |
|---------------|-----------|---------|
| SQL Injection | ✅ | Prisma ORM with parameterized queries |
| XSS | ✅ | React's built-in XSS protection + helmet headers |
| CSRF | ✅ | CSRF guard with double-submit cookie pattern |
| Brute Force Login | ✅ | Rate limiting (100 req/min) + account lockout (5 fails/15min) |
| JWT Forgery | ⚠️ Partial | Dev secret used; production needs strong random secret |
| Dependency Vulns | ✅ | npm overrides + trivy + snyk scanning |
| Secret Leakage | ✅ | .env gitignored, semgrep rule for hardcoded secrets |
| DoS | ✅ | Rate limiting + request body size limit (1MB) |
| Privilege Escalation | ✅ | RBAC with 7 roles + RolesGuard |
| Replay Attack | ✅ | Idempotency-Key on mutation endpoints |
| Supply Chain | ✅ | npm overrides, lockfile, SBOM in CI |

---

## Security Tools Installed (Local)

| Tool | Location | Last Updated |
|------|----------|-------------|
| semgrep | Global (pip) | 2026-05-31 |
| njsscan | Global (pip) | 2026-05-31 |
| trivy | Global (binary) | 2026-05-31 |
| snyk | Global (npm) | 2026-05-31 |
| codespell | Global (pip) | 2026-05-31 |
| trufflehog | Global (pip) | 2026-05-31 |
| CodeQL | GitHub Workflow | 2026-05-31 |

## Daily Update Script
`C:\Users\EPower\AppData\Local\Temp\opencode\security-update.bat`
Run once: `schtasks /create /sc daily /tn "MeterPulse-SecurityUpdate" /tr "C:\Users\EPower\AppData\Local\Temp\opencode\security-update.bat" /st 09:00`
