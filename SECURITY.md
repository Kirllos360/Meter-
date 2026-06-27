# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| MVP (current) | ✅ Active development |

## Reporting a Vulnerability

To report a security issue, please open a GitHub Issue with the label `security` or contact the repository owner directly.

Do NOT open a public issue for critical vulnerabilities — use the private reporting mechanism in GitHub Security tab.

## Security Controls

This project implements:
- **JWT Authentication** with RBAC (7 roles)
- **Helmet** HTTP security headers
- **CORS** origin whitelist
- **Rate limiting** (100 req/min)
- **CSRF** double-submit cookie protection
- **Input validation** via class-validator
- **Idempotency-Key** for mutation endpoints
- **Append-only audit log** with SHA-256 hash chain
- **SQL injection protection** via Prisma ORM
- **Dependency scanning** via Dependabot + Trivy + Snyk
- **SAST scanning** via Semgrep + njsscan + CodeQL
- **Secret scanning** via TruffleHog
- **Pre-commit hooks** via Husky

## Build Security

See `.github/workflows/test-agent.yml` for CI security checks run on every push.
