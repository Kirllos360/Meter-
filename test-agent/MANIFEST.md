# Test Agent — Master Tool Manifest
# DO NOT DELETE: This is the single source of truth for all test tools.
# Last updated: 2026-05-31
# Purpose: Centralize all tool configs so they never need re-download.

## Tool Inventory

| Tool | Version | Location | Config File | Purpose |
|------|---------|----------|-------------|---------|
| jest | 29.x | backend/node_modules | backend/jest.config.ts | Backend test runner |
| eslint | 8.x | backend/node_modules | backend/.eslintrc.cjs | JavaScript/TS linter |
| prettier | 3.x | backend/node_modules | backend/.prettierrc | Code formatter |
| semgrep | 1.164 | global (pip) | test-agent/configs/.semgrep-rules.yaml | SAST code analysis |
| trivy | 0.70 | global (binary) | — | Container/dependency vuln scanner |
| spectral | 6.x | npx | test-agent/configs/.spectral.yaml | OpenAPI linting |
| depcruise | latest | backend/node_modules | test-agent/configs/.dependency-cruiser.js | Dependency graph validation |
| typedoc | latest | backend/node_modules | backend/typedoc.json | API documentation |
| supertest | latest | backend/node_modules | — | HTTP test assertions |
| playwright | 1.60 | Frontend/node_modules | Frontend/playwright.config.ts | E2E browser tests |
| trufflehog | latest | global (pip) | — | Secret scanning |
| husky | 9.x | root/node_modules | .husky/pre-commit | Pre-commit hooks |
| lint-staged | 15.x | root/node_modules | root package.json | Staged file linters |
| graphify | latest | global (pip) | test-agent/configs/graphify.config.json | Knowledge graph |
| cyclonedx-npm | latest | npx | — | SBOM generation (CI) |
| NestJS Logger | built-in | backend/src | main.ts | Structured logging (levels per env) |

## Tool Installation Scripts (to prevent re-download)
```bash
# Run once to install all global tools:
pip install semgrep trufflehog
npm install -g @cyclonedx/cyclonedx-npm
# Install Trivy: https://aquasecurity.github.io/trivy/latest/getting-started/installation/
```

## Tool Locations (for test-agent use)
| Tool | Invocation |
|------|-----------|
| jest | `cd backend && npx jest` |
| eslint | `cd backend && npx eslint` |
| prettier | `cd backend && npx prettier` |
| semgrep | `semgrep --config=test-agent/configs/.semgrep-rules.yaml` |
| trivy | `trivy fs --severity CRITICAL,HIGH --quiet --no-progress` |
| spectral | `npx spectral --ruleset=test-agent/configs/.spectral.yaml` |
| depcruise | `cd backend && npx depcruise` |
| njsscan | `njsscan backend/src Frontend/src` |
| codespell | `codespell backend/src Frontend/src` |
| snyk | `cd backend && snyk test` |
| trufflehog | `trufflehog filesystem --no-verification .` |
| cyclonedx | `npx @cyclonedx/cyclonedx-npm` |

| CodeQL | latest | GitHub workflow | .github/workflows/codeql.yml | GitHub-native security analysis (zero config)
| OSV Scanner | latest | pip | � | Open source dependency vulnerability scanner

## Token Optimization Configs
- Test output: `--silent --bail` (stop on first failure)
- ESLint: `--max-warnings 0 --quiet`
- Prettier: `--check --loglevel error`
- Graphify: `parallel=False` (sequential to avoid Windows issues)
- Trivy: `--severity CRITICAL,HIGH --quiet --no-progress`

## Run Order (optimized for speed)
1. prettier (fastest check)
2. eslint (fast)
3. build (fast)
4. prisma validate (very fast)
5. tests (medium - 50s)
6. depcruise (fast)
7. semgrep (medium)
8. spectral (fast)
9. trivy (slowest - only for deploy)
10. graphify (slow - only after code change)

