# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.14

FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

FROM deps AS builder
WORKDIR /app
COPY . .
RUN bun build src/worker.ts --target=bun --outfile=dist/worker.js \
    && bun build scripts/migrate.ts --target=bun --outfile=dist/migrate.js

FROM oven/bun:${BUN_VERSION}-slim AS dev
WORKDIR /app
ENV NODE_ENV=development \
    UPLOAD_ROOT=/data/uploads
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /data/uploads
CMD ["bun", "run", "worker"]

FROM oven/bun:${BUN_VERSION}-slim AS tool
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist/migrate.js ./migrate.js
COPY drizzle ./drizzle
CMD ["bun", "migrate.js"]

# Keep production as the last stage so `docker build -f worker.Dockerfile .`
# does not accidentally ship the dev/tool stage.
FROM oven/bun:${BUN_VERSION}-slim AS production
WORKDIR /app
ENV NODE_ENV=production \
    UPLOAD_ROOT=/data/uploads

RUN groupadd --system --gid 1001 formalist \
    && useradd --system --uid 1001 --gid formalist formalist \
    && mkdir -p /data/uploads \
    && chown -R formalist:formalist /app /data/uploads

COPY --from=builder --chown=formalist:formalist /app/dist/worker.js ./worker.js
COPY --chown=formalist:formalist drizzle ./drizzle

USER formalist
CMD ["bun", "worker.js"]
