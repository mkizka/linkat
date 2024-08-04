#!/usr/bin/env bash
set -euo pipefail

if [ ! -d ./atproto/node_modules ]; then
  cd atproto
  make deps
  make build
  cd ..
fi

docker compose up -d --wait
pnpm prisma db push
pnpm run-p -l '_dev:*'
