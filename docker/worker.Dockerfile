# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.14

FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

FROM oven/bun:${BUN_VERSION}-slim AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --ignore-scripts \
    && rm -rf /root/.bun/install/cache /tmp/*

FROM oven/bun:${BUN_VERSION}-slim AS dev
WORKDIR /app
ENV NODE_ENV=development \
    UPLOAD_ROOT=/data/uploads
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /data/uploads
CMD ["bun", "run", "worker"]

FROM dev AS tool
CMD ["bun", "run", "db:migrate"]

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

COPY --from=prod-deps --chown=formalist:formalist /app/node_modules ./node_modules
COPY --chown=formalist:formalist package.json tsconfig.json ./
COPY --chown=formalist:formalist src ./src
COPY --chown=formalist:formalist drizzle ./drizzle

USER formalist
CMD ["bun", "src/worker.ts"]
