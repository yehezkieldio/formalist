# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=24

FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

FROM deps AS builder
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN bun run build

# Next.js standalone output is a Node server, so production does not need Bun.
# Distroless keeps the runtime small and removes shell/package-manager baggage.
FROM gcr.io/distroless/nodejs${NODE_VERSION}-debian12:nonroot AS production
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    UPLOAD_ROOT=/data/uploads

COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public ./public

USER nonroot
EXPOSE 3000
CMD ["server.js"]
