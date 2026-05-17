# Ellie AI Setup Guide

Ellie is a TypeScript full-stack application with a React/Vite frontend and an Express/tRPC backend. This guide documents the actual repository layout, local setup path, production build path, Docker workflow, and health/readiness checks for the current hardened release.

## Runtime Overview

The application runs from a single root package. The development command starts the Express server through `tsx` and mounts Vite middleware, while the production build emits static client assets and a bundled server entrypoint.

| Layer       | Implementation                                         | Primary Paths                                      |
| ----------- | ------------------------------------------------------ | -------------------------------------------------- |
| Frontend    | React 19, Vite 7, Tailwind CSS 4                       | `client/`                                          |
| Backend     | Express 4, tRPC 11, TypeScript                         | `server/`                                          |
| Persistence | Drizzle ORM with a MySQL-compatible database           | `drizzle/schema.ts`, `server/db.ts`                |
| Storage     | S3-compatible helper                                   | `server/storage.ts`                                |
| Operations  | Environment validator, health, and readiness endpoints | `scripts/validate-env.ts`, `server/_core/index.ts` |

## Prerequisites

| Tool                      |           Version | Why It Is Needed                                               |
| ------------------------- | ----------------: | -------------------------------------------------------------- |
| Node.js                   |       22 or newer | Runs the development server and production bundle.             |
| pnpm                      |              10.x | Installs dependencies according to the repository lockfile.    |
| MySQL-compatible database |    8.x compatible | Required for production data persistence and readiness checks. |
| S3-compatible storage     | Provider-specific | Required for production media uploads and generated artifacts. |

## Local Development

```bash
git clone https://github.com/Alexi5000/Ellie.git
cd Ellie
pnpm install --frozen-lockfile
cp .env.example .env
pnpm validate:env
pnpm dev
```

In development mode, `pnpm validate:env` reports missing production secrets as inventory findings instead of blocking startup. This lets contributors work on UI and non-provider code without production credentials.

## Production Environment

Production deployments must provide the variables below. The validator prints status labels only and does not expose secret values.

| Variable                 | Required | Description                                            |
| ------------------------ | -------: | ------------------------------------------------------ |
| `DATABASE_URL`           |      Yes | MySQL-compatible connection string for Drizzle.        |
| `JWT_SECRET`             |      Yes | Secret used for session and token signing.             |
| `BUILT_IN_FORGE_API_URL` |      Yes | Provider gateway endpoint for AI workflows.            |
| `BUILT_IN_FORGE_API_KEY` |      Yes | Provider gateway credential.                           |
| `VITE_APP_ID`            |       No | Optional public app identifier.                        |
| `VITE_APP_TITLE`         |       No | Optional public app title.                             |
| `OAUTH_SERVER_URL`       |       No | Optional OAuth server for authenticated deployments.   |
| `OWNER_OPEN_ID`          |       No | Optional owner identifier for seeded deployments.      |
| `PORT`                   |       No | HTTP port. The app defaults to `5000` where supported. |

Run production validation before building or promoting a release.

```bash
NODE_ENV=production pnpm validate:env
# or
pnpm validate:env:production
```

## Database Setup

The schema is defined in `drizzle/schema.ts`. Review generated migrations before applying them to a shared environment.

```bash
pnpm db:generate
pnpm db:migrate
```

For local iteration, the repository also provides:

```bash
pnpm db:push
```

Use migration review for production. Avoid applying schema changes directly to production without a rollback plan and database backup.

## Validation Gates

Run these commands before opening a pull request or release candidate.

| Gate                        | Command                          |
| --------------------------- | -------------------------------- |
| Install consistency         | `pnpm install --frozen-lockfile` |
| Environment inventory       | `pnpm validate:env`              |
| Production environment gate | `pnpm validate:env:production`   |
| Type safety                 | `pnpm check`                     |
| Tests                       | `pnpm test`                      |
| Build                       | `pnpm build`                     |
| Full local gate             | `pnpm ci`                        |

## Production Build and Start

```bash
pnpm install --frozen-lockfile
pnpm validate:env:production
pnpm check
pnpm test
pnpm build
NODE_ENV=production pnpm start
```

The built server runs from `dist/index.js`. The Express runtime serves the built client assets and the tRPC API from the same process.

## Docker Workflow

```bash
docker build -t ellie-ai:local .
docker run --rm -p 5000:5000 --env-file .env ellie-ai:local
```

After the container starts, verify liveness and readiness:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/readiness
```

`/api/health` is suitable for container liveness checks. `/api/readiness` is stricter because it reports production configuration and dependency readiness.

## Troubleshooting

| Symptom                                      | Likely Cause                                   | Resolution                                                                       |
| -------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `validate:env:production` fails              | Missing required production variables          | Add the missing variables in the deployment secret store.                        |
| `/api/health` fails                          | Server is not running or wrong port is exposed | Confirm `PORT`, container mapping, and process logs.                             |
| `/api/readiness` reports not ready           | Missing secrets or database connection failure | Check `DATABASE_URL`, database reachability, and production secrets.             |
| TypeScript check fails after editing routers | Client/server contract drift                   | Update tRPC procedure types and client calls together.                           |
| Docker build fails during install            | Lockfile or package-manager mismatch           | Use the pinned pnpm version and commit lockfile updates with dependency changes. |

## Next Backend Build-Out

The next backend increment should add durable processing jobs, provider adapters, authentication enforcement, and integration tests. These changes should be implemented behind typed interfaces so local tests can run without real provider credentials.
