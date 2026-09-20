#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --wait
echo "SELECT 'CREATE DATABASE linkat' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'linkat')\gexec" |
  docker compose exec -T db psql -q -U postgres > /dev/null
set -a
source .env
set +a
pnpm drizzle-kit migrate
