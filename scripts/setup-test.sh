#!/usr/bin/env bash
set -euo pipefail

docker compose up db -d --wait > /dev/null
NODE_ENV=test pnpm drizzle-kit migrate
