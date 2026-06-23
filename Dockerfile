# syntax=docker/dockerfile:1.7

FROM node:22.13.0-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Upgrade corepack before enabling it: the corepack bundled with node:22.13.0
# ships stale signing keys and fails to verify recent pnpm releases
# ("Cannot find matching keyid"). corepack@latest carries the current keys.
RUN npm install -g corepack@latest && corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
# Activate the exact pnpm version pinned in package.json's "packageManager"
# field so corepack never reaches out for "latest" during install.
RUN corepack prepare --activate
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm check && pnpm test && pnpm build

FROM node:22.13.0-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN groupadd --system ellie && useradd --system --gid ellie --home-dir /app ellie
COPY --from=build --chown=ellie:ellie /app/package.json ./package.json
COPY --from=build --chown=ellie:ellie /app/dist ./dist
USER ellie
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/index.js"]
