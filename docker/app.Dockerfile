# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.5

FROM oven/bun:${BUN_VERSION}-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

FROM base AS dev
ENV NODE_ENV=development
ENV UPLOAD_ROOT=/data/uploads
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /data/uploads
EXPOSE 3000
CMD ["bun", "run", "dev", "--hostname", "0.0.0.0"]

FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS production
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_ROOT=/data/uploads

RUN groupadd --system --gid 1001 formalist \
    && useradd --system --uid 1001 --gid formalist formalist \
    && mkdir -p /app /data/uploads \
    && chown -R formalist:formalist /app /data/uploads

COPY --from=builder --chown=formalist:formalist /app/.next/standalone ./
COPY --from=builder --chown=formalist:formalist /app/.next/static ./.next/static
COPY --from=builder --chown=formalist:formalist /app/public ./public

USER formalist
EXPOSE 3000
CMD ["bun", "server.js"]
