#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --wait
NODE_ENV=development pnpm drizzle-kit migrate
