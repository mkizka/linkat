#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --wait
set -a
source .env
set +a
pnpm drizzle-kit migrate
