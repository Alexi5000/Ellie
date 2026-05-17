# Ellie AI Documentation Hub

This documentation hub organizes the current Ellie AI engineering, setup, release, testing, deployment, and reference material. Ellie’s active application is a full-stack TypeScript project with a React/Vite frontend and an Express/tRPC backend.

## Start Here

| Document | Audience | Purpose |
|---|---|---|
| [`../README.md`](../README.md) | Everyone | Product overview, architecture, scripts, backend status, and release posture. |
| [`../SETUP.md`](../SETUP.md) | Developers and operators | Local setup, production build, Docker workflow, environment variables, and health checks. |
| [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) | Maintainers and release owners | Backend readiness status, operational endpoints, release gates, and risk register. |
| [`../RELEASES.md`](../RELEASES.md) | Maintainers and reviewers | Version history and planned backend milestones. |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Contributors | Branching, validation, documentation, backend, and review expectations. |

## Current Repository Map

| Area | Path | Status |
|---|---|---|
| Frontend application | `client/` | Active React/Vite application. |
| Backend runtime | `server/` | Active Express/tRPC backend. |
| Database schema | `drizzle/` | Active Drizzle schema and migration configuration. |
| Shared contracts | `shared/` | Active shared TypeScript definitions. |
| Automation scripts | `scripts/` | Active validation and repository scripts. |
| Product assets | `assets/` | Active README and product imagery. |
| GitHub automation | `.github/` | Existing workflow and review configuration; verify workflow permissions before pushing changes. |
| Historical/reference docs | `docs/migration/` | Reference material unless a migration is explicitly approved. |

## Operational Documentation

| Document | Notes |
|---|---|
| [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) | Source of truth for current release gates and backend risk posture. |
| [`deployment/DEPLOYMENT.md`](deployment/DEPLOYMENT.md) | Existing deployment notes. Review against `SETUP.md` before using for production. |
| [`deployment/SSL_SETUP_GUIDE.md`](deployment/SSL_SETUP_GUIDE.md) | Existing SSL reference. Validate with the chosen hosting provider. |
| [`service-discovery.md`](service-discovery.md) | Existing architecture reference. Treat as supporting documentation, not a replacement for the current README. |

## Testing and Quality Documentation

| Document | Notes |
|---|---|
| [`testing/QUICK_TEST_GUIDE.md`](testing/QUICK_TEST_GUIDE.md) | Existing testing quick reference. Align commands with root `pnpm` scripts when updating. |
| [`testing/TEST_ENVIRONMENT.md`](testing/TEST_ENVIRONMENT.md) | Existing environment testing reference. |
| [`testing/BACKEND_TEST_ENVIRONMENT.md`](testing/BACKEND_TEST_ENVIRONMENT.md) | Existing backend testing material; update as provider adapters and integration tests are added. |
| [`testing/FRONTEND_TEST_ENVIRONMENT.md`](testing/FRONTEND_TEST_ENVIRONMENT.md) | Existing frontend testing material. |
| [`testing/MONITORING_TESTS_README.md`](testing/MONITORING_TESTS_README.md) | Existing monitoring test material. |

## CI and Workflow Documentation

| Document | Notes |
|---|---|
| [`ci-cd/CI_CD_PIPELINE.md`](ci-cd/CI_CD_PIPELINE.md) | Existing CI/CD overview. Confirm it matches current root scripts before treating it as authoritative. |
| [`ci-cd/CI_CD_SETUP.md`](ci-cd/CI_CD_SETUP.md) | Existing setup guide for GitHub automation. |
| [`ci-cd/CI_CD_STATUS.md`](ci-cd/CI_CD_STATUS.md) | Existing status notes. Update after workflow changes. |
| [`ci-cd/QUICK_REFERENCE.md`](ci-cd/QUICK_REFERENCE.md) | Existing command reference. Prefer current `package.json` scripts when conflicts appear. |

## Product and UI Documentation

| Document | Notes |
|---|---|
| [`marketing-site/README.md`](marketing-site/README.md) | Existing marketing-site reference. |
| [`marketing-site/COMPONENT_API.md`](marketing-site/COMPONENT_API.md) | Existing component reference. |
| [`marketing-site/THEME_SYSTEM.md`](marketing-site/THEME_SYSTEM.md) | Existing theme and design-system notes. |
| [`marketing-site/ACCESSIBILITY_FEATURES.md`](marketing-site/ACCESSIBILITY_FEATURES.md) | Existing accessibility notes. |
| [`marketing-site/DEPLOYMENT_GUIDE.md`](marketing-site/DEPLOYMENT_GUIDE.md) | Existing deployment notes for the marketing surface. |

## Migration and Reference Material

The `docs/migration/backend-fastapi-reference/` folder is reference material from prior backend exploration. Ellie’s active backend is currently TypeScript, Express, tRPC, Drizzle, and MySQL-compatible persistence. A future FastAPI or Python service should be handled through an explicit architecture decision record and migration plan rather than quietly mixing runtime models.

| Reference | Use |
|---|---|
| [`migration/FASTAPI_MIGRATION_SUMMARY.md`](migration/FASTAPI_MIGRATION_SUMMARY.md) | Historical migration exploration. |
| [`migration/backend-fastapi-reference/README.md`](migration/backend-fastapi-reference/README.md) | Reference-only Python backend notes. |

## Documentation Maintenance Rules

Documentation should be updated in the same pull request as the code it describes. Runtime behavior changes must update `README.md`, `SETUP.md`, `PRODUCTION_READINESS.md`, `RELEASES.md`, and `.env.example` when relevant.

| Change Type | Required Documentation Review |
|---|---|
| New backend route or tRPC procedure | README architecture, production readiness, PR notes, tests. |
| New environment variable | `.env.example`, setup guide, production readiness, release notes. |
| Database schema change | README data model, setup migration instructions, release notes. |
| Deployment change | Setup guide, Docker notes, CI/CD docs, production readiness. |
| Provider integration change | Backend roadmap/status, setup secrets, test documentation, release notes. |

## Status

| Item | Current Status |
|---|---|
| Main README | Updated for Ellie AI `1.1.0` production-hardening baseline. |
| Setup guide | Added as `SETUP.md`. |
| Production readiness | Added as `docs/PRODUCTION_READINESS.md`. |
| Release history | Added as `RELEASES.md`. |
| Contribution guide | Updated to match the current root pnpm workflow. |
| Legacy docs | Preserved but marked as supporting or reference material where needed. |

**Last updated:** 2026-05-16

**Current version:** 1.1.0
