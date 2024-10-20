#!/usr/bin/env bash
set -euo pipefail

source ./scripts/setup-dev.sh
NODE_ENV=development tsx watch --ignore vite.config.ts.* --env-file .env ./app/server.ts
