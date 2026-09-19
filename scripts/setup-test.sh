#!/usr/bin/env bash
set -euo pipefail

docker compose up db -d --wait > /dev/null
set -a
source .env.test
set +a
node ./scripts/ensure-database.js
NODE_ENV=test pnpm drizzle-kit migrate
