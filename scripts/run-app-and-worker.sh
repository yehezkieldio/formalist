#!/usr/bin/env bash
set -euo pipefail

pids=()

cleanup() {
    local status=$?
    trap - INT TERM EXIT

    for pid in "${pids[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
        fi
    done

    sleep 1

    for pid in "${pids[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
        fi
    done

    wait 2>/dev/null || true
    exit "$status"
}

start_process() {
    local name=$1
    shift

    printf 'Starting %s...\n' "$name"
    setsid "$@" &
    pids+=("$!")
}

trap cleanup INT TERM EXIT

start_process worker bun run worker
start_process app bun run dev

wait -n "${pids[@]}"
