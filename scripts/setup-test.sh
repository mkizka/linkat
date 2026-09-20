#!/usr/bin/env bash
set -euo pipefail

docker compose up db -d --wait > /dev/null
docker compose exec -T db createdb -U postgres test 2>/dev/null || true
node --env-file=.env.test node_modules/drizzle-kit/bin.cjs migrate
