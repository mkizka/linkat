#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --wait > /dev/null
pnpm prisma db push --skip-generate
