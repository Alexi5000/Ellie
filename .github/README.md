# Ellie AI GitHub Automation

This directory contains GitHub metadata for Ellie AI, including workflow definitions, pull request guidance, auto-assignment configuration, and repository automation notes.

## Current Review Standard

Pull requests should prove that the application remains buildable, type-safe, documented, and operationally understandable. Backend or deployment changes should include environment validation and health/readiness evidence.

| Gate                        | Preferred Command                          |
| --------------------------- | ------------------------------------------ |
| Install consistency         | `pnpm install --frozen-lockfile`           |
| Environment inventory       | `pnpm validate:env`                        |
| Production environment gate | `pnpm validate:env:production`             |
| Type safety                 | `pnpm check`                               |
| Unit tests                  | `pnpm test`                                |
| Production build            | `pnpm build`                               |
| Full gate                   | `pnpm run ci`                              |
| Liveness smoke test         | `curl /api/health`                         |
| Readiness smoke test        | `curl /api/readiness` or `curl /api/ready` |

## Workflow Inventory

The repository contains several workflow files. Some were created before the current root pnpm workflow was standardized, so maintainers should verify each workflow against `package.json` before relying on it as an authoritative release gate.

| Workflow                     | Intended Purpose                     | Maintainer Note                                                                                                 |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `workflows/ci.yml`           | General CI checks                    | Should align with `pnpm validate:env`, `pnpm check`, `pnpm test`, and `pnpm build`.                             |
| `workflows/test.yml`         | Test automation                      | Should use root pnpm scripts.                                                                                   |
| `workflows/code-quality.yml` | Formatting, type, and quality checks | Confirm commands exist before enabling required status checks.                                                  |
| `workflows/docker.yml`       | Container build validation           | Should build the root `Dockerfile` and smoke-test `/api/health`.                                                |
| `workflows/performance.yml`  | Performance monitoring               | Should be treated as optional until Lighthouse targets are confirmed.                                           |
| `workflows/cd.yml`           | Deployment automation                | Do not enable production deployment until secrets, environments, rollback, and readiness checks are configured. |
| `workflows/release.yml`      | Release automation                   | Should publish releases only after the release checklist in `RELEASES.md` is satisfied.                         |
| `workflows/pr-checks.yml`    | Pull request metadata checks         | Should support the updated PR template.                                                                         |

## Required Secrets for Production Workflows

Secrets should be configured in GitHub Actions or the deployment platform, never committed to the repository.

| Secret                   | Purpose                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `DATABASE_URL`           | MySQL-compatible database connection string.                         |
| `JWT_SECRET`             | Session and token signing secret.                                    |
| `BUILT_IN_FORGE_API_URL` | AI/provider gateway endpoint.                                        |
| `BUILT_IN_FORGE_API_KEY` | AI/provider gateway credential.                                      |
| `AWS_ACCESS_KEY_ID`      | Optional object storage credential when using S3-compatible storage. |
| `AWS_SECRET_ACCESS_KEY`  | Optional object storage credential when using S3-compatible storage. |
| `AWS_REGION`             | Optional object storage region.                                      |
| `S3_BUCKET_NAME`         | Optional media bucket name.                                          |
| `DOCKER_USERNAME`        | Optional container registry username.                                |
| `DOCKER_PASSWORD`        | Optional container registry token or password.                       |

## Maintainer Guidance

Workflow updates may require a GitHub token or app installation with workflow-write permission. If a branch push is rejected because workflow files changed, push the application changes first and apply workflow changes separately from an account with the required permission.

The current documentation source of truth is:

| Document                                                             | Purpose                                         |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| [`../README.md`](../README.md)                                       | Product and architecture overview.              |
| [`../SETUP.md`](../SETUP.md)                                         | Setup, build, Docker, and runtime instructions. |
| [`../docs/PRODUCTION_READINESS.md`](../docs/PRODUCTION_READINESS.md) | Release gates and operational readiness.        |
| [`../RELEASES.md`](../RELEASES.md)                                   | Version history and milestone plan.             |
| [`PULL_REQUEST_TEMPLATE.md`](PULL_REQUEST_TEMPLATE.md)               | Required review evidence for each PR.           |
