#!/usr/bin/env bash
set -euo pipefail

bun run lint
bun run typecheck
bun test

if [[ "${RUN_BROWSER_E2E:-0}" == "1" ]]; then
    bun run test:e2e
else
    echo "Skipping browser smoke tests. Set RUN_BROWSER_E2E=1 when app services are available."
fi
