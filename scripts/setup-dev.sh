#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --wait
docker compose exec -T db createdb -U postgres linkat 2>/dev/null || true
node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate
