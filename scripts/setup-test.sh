#!/usr/bin/env bash
set -euo pipefail

docker compose up db -d --wait > /dev/null
pnpm prisma migrate deploy --skip-generate
