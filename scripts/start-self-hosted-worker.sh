#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOYMENT_MODE:=self-hosted}"
: "${DATABASE_PROVIDER:=postgres}"
: "${QUEUE_PROVIDER:=local-redis}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required for self-hosted worker mode." >&2
  exit 1
fi

if [[ "${QUEUE_PROVIDER}" == "local-redis" && -z "${REDIS_URL:-}" ]]; then
  echo "REDIS_URL is required when QUEUE_PROVIDER=local-redis." >&2
  exit 1
fi

if [[ -n "${UPLOAD_ROOT:-}" ]]; then
  mkdir -p "${UPLOAD_ROOT}"
fi

export DATABASE_PROVIDER DEPLOYMENT_MODE QUEUE_PROVIDER

bun run worker
