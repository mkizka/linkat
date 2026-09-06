#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --wait
pnpm prisma migrate deploy
