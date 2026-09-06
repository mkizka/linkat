#!/usr/bin/env bash
set -euo pipefail

ATPROTO_COMMIT=$(cat .atproto-version)
ATPROTO_DIR="$HOME/.cache/atproto/$ATPROTO_COMMIT"

# git submoduleを使うとDockerビルド中に動作しないため、gigetを使ってatprotoを取得する
if [ ! -d "$ATPROTO_DIR" ]; then
  pnpm giget gh:bluesky-social/atproto#$ATPROTO_COMMIT "$ATPROTO_DIR"
fi
pnpm lex build --lexicons ./lexicons --out ./app/generated --clear

pnpm prisma generate
