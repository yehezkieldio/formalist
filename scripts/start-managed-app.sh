#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOYMENT_MODE:=managed-fallback}"
: "${DATABASE_PROVIDER:=supabase}"
: "${QUEUE_PROVIDER:=upstash-redis}"

if [[ -z "${SUPABASE_DATABASE_URL:-${DATABASE_URL:-}}" ]]; then
  echo "SUPABASE_DATABASE_URL or DATABASE_URL is required for managed app mode." >&2
  exit 1
fi

if [[ "${QUEUE_PROVIDER}" == "upstash-redis" ]]; then
  if [[ -z "${UPSTASH_REDIS_REST_URL:-}" || -z "${UPSTASH_REDIS_REST_TOKEN:-}" ]]; then
    echo "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for Upstash queue mode." >&2
    exit 1
  fi
fi

export DEPLOYMENT_MODE DATABASE_PROVIDER QUEUE_PROVIDER

bun run start
