#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --wait
set -a
source .env
set +a
node ./scripts/ensure-database.js
NODE_ENV=development pnpm drizzle-kit migrate
