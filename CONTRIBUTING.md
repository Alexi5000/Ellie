# Contributing to Ellie AI

Thank you for contributing to Ellie AI. This repository is being hardened as a professional full-stack TypeScript application, so every contribution should improve product quality, backend correctness, operational readiness, documentation accuracy, or release confidence.

## Working Agreement

Contributors should keep changes small enough to review, document operational impact, and run the required validation gates before requesting review. Ellie’s active backend is the TypeScript Express/tRPC runtime in `server/`; the FastAPI material under `docs/migration/` is reference material unless a future migration is explicitly approved.

| Principle | Expectation |
|---|---|
| Backend truthfulness | Do not document unimplemented provider workflows as production-complete. Mark planned work clearly. |
| Type safety | Keep client calls, tRPC procedures, shared types, and database schema changes aligned. |
| Operational readiness | Update health, readiness, setup, and release documentation when runtime behavior changes. |
| Security hygiene | Do not commit secrets, generated credentials, private media, or local environment files. |
| Reviewability | Use focused branches, conventional commits, validation evidence, and clear PR descriptions. |

## Prerequisites

| Tool | Version | Purpose |
|---|---:|---|
| Node.js | 22 or newer | Development and production runtime. |
| pnpm | 10.x | Dependency management through the lockfile. |
| MySQL-compatible database | 8.x compatible | Required for database-backed production flows. |
| Docker | Current stable | Optional but recommended for release and deployment validation. |

## Local Setup

```bash
git clone https://github.com/Alexi5000/Ellie.git
cd Ellie
pnpm install --frozen-lockfile
cp .env.example .env
pnpm validate:env
pnpm dev
```

The local validator reports missing production-only variables as inventory findings in development. Production validation is stricter and should be run in a secret-complete environment.

## Branch Strategy

Use branch names that identify the intent and surface area of the change.

| Branch Prefix | Use Case |
|---|---|
| `feature/` | Product or backend capability changes. |
| `fix/` | Defect correction. |
| `docs/` | Documentation-only updates. |
| `hardening/` | Production-readiness, security, or release-gate work. |
| `chore/` | Maintenance tasks such as dependency or tooling updates. |

Do not push directly to `main`. Open a pull request and include validation evidence.

## Commit Messages

Use Conventional Commits so release notes and code review history remain readable.

| Prefix | Meaning |
|---|---|
| `feat:` | User-visible or backend capability. |
| `fix:` | Bug fix. |
| `docs:` | Documentation-only change. |
| `refactor:` | Code structure change without behavior change. |
| `test:` | Test addition or correction. |
| `chore:` | Tooling, dependency, or maintenance change. |
| `security:` | Security hardening or vulnerability remediation. |

## Required Validation

Run the relevant gates before opening a pull request. Backend or runtime changes should run the full set.

| Gate | Command | When Required |
|---|---|---|
| Install consistency | `pnpm install --frozen-lockfile` | Dependency or lockfile changes. |
| Environment inventory | `pnpm validate:env` | Every PR that touches backend, config, docs, or deployment. |
| Production environment gate | `pnpm validate:env:production` | Release candidates and deployment changes. |
| Typecheck | `pnpm check` | Every code PR. |
| Tests | `pnpm test` | Every code PR. |
| Build | `pnpm build` | Every code or deployment PR. |
| Full gate | `pnpm ci` | Release candidates and large backend changes. |

## Backend Contribution Rules

Backend changes should preserve clear boundaries between request handling, persistence, provider integration, and operational checks.

| Area | Rule |
|---|---|
| tRPC routers | Validate inputs with schemas and keep client contracts synchronized. |
| Database schema | Generate migrations, review diffs, and document rollback considerations. |
| Provider integrations | Use adapter boundaries so tests can run without real provider credentials. |
| Health/readiness | Keep `/api/health` lightweight and reserve `/api/readiness` for configuration and dependency status. |
| Secrets | Read secrets only from environment variables or platform secret stores. |
| Long-running work | Prefer durable jobs over request-bound media processing. |

## Documentation Requirements

Update documentation when a change affects setup, environment variables, endpoints, release gates, architecture, or user-visible behavior.

| Document | Update When |
|---|---|
| `README.md` | Product positioning, architecture, scripts, or operational behavior changes. |
| `SETUP.md` | Installation, environment, Docker, database, or runtime instructions change. |
| `docs/PRODUCTION_READINESS.md` | Backend readiness, operational gates, or risk posture changes. |
| `RELEASES.md` | Any release candidate, milestone, or production-impacting change is introduced. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Review policy or validation expectations change. |

## Pull Request Expectations

A professional PR should include a plain-language summary, validation commands, operational impact, screenshots for UI changes, and explicit notes for backend, database, environment, and deployment effects.

Before requesting review, confirm that no `.env`, credentials, private media, generated logs, or local build artifacts have been committed.

## Reporting Bugs

A high-quality bug report should include the affected route or endpoint, reproduction steps, expected behavior, actual behavior, environment details, logs with secrets redacted, and whether `/api/health` or `/api/readiness` is failing.

## License

By contributing, you agree that your contributions are licensed under the MIT License.
