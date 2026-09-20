#!/usr/bin/env bash
set -euo pipefail

docker compose up db -d --wait > /dev/null
echo "SELECT 'CREATE DATABASE test' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test')\gexec" |
  docker compose exec -T db psql -q -U postgres > /dev/null
set -a
source .env.test
set +a
pnpm drizzle-kit migrate
