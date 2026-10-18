# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
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
RUN pnpm prune --prod

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN apk upgrade --no-cache && rm -rf /usr/local/lib/node_modules/npm /opt/yarn-*
RUN rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg
RUN addgroup -S ellie && adduser -S -G ellie -h /app ellie
COPY --from=build --chown=ellie:ellie /app/package.json ./package.json
COPY --from=build --chown=ellie:ellie /app/dist ./dist
COPY --from=build --chown=ellie:ellie /app/node_modules ./node_modules
USER ellie
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/index.js"]
