#!/usr/bin/env bash
set -euo pipefail

ATPROTO_COMMIT=$(cat .atproto-version)
ATPROTO_DIR="$HOME/.cache/atproto/$ATPROTO_COMMIT"

# 1. Setup atproto dev server
if [ ! -d "$ATPROTO_DIR/node_modules" ]; then
  cd "$ATPROTO_DIR"
  make deps
  make build
  cd -
fi

# 2. Start atproto dev server
nohup pnpm dev-atproto &
pid=$!
echo "Started atproto dev server with pid $pid"
trap "
echo
echo 'kill -STOP $pid && docker compose down'
kill $pid
docker compose down
exit
" SIGINT SIGTERM

# 3. Setup database and jetstream
pnpm wait-on tcp:2583 && docker compose up -d --wait
pnpm prisma migrate deploy
