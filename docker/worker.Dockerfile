# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.5

FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

FROM base AS prod-deps
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --ignore-scripts

FROM base AS dev
ENV NODE_ENV=development
ENV UPLOAD_ROOT=/data/uploads
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /data/uploads
CMD ["bun", "run", "worker"]

FROM base AS production
ENV NODE_ENV=production
ENV UPLOAD_ROOT=/data/uploads

RUN groupadd --system --gid 1001 formalist \
    && useradd --system --uid 1001 --gid formalist formalist \
    && mkdir -p /app /data/uploads \
    && chown -R formalist:formalist /app /data/uploads

COPY --from=prod-deps --chown=formalist:formalist /app/node_modules ./node_modules
COPY --chown=formalist:formalist package.json tsconfig.json ./
COPY --chown=formalist:formalist src ./src
COPY --chown=formalist:formalist drizzle ./drizzle

USER formalist
CMD ["bun", "src/worker.ts"]

FROM dev AS tool
CMD ["bun", "run", "db:migrate"]
