#!/usr/bin/env bash
set -euo pipefail

ATPROTO_COMMIT=$(cat .atproto-version)
ATPROTO_DIR="$HOME/.cache/atproto/$ATPROTO_COMMIT"

# git submoduleを使うとDockerビルド中に動作しないため、gigetを使ってatprotoを取得する
if [ ! -d "$ATPROTO_DIR" ]; then
  pnpm giget gh:bluesky-social/atproto#$ATPROTO_COMMIT "$ATPROTO_DIR"
fi
mkdir -p ./lexicons/com/atproto
cp -r "$ATPROTO_DIR/lexicons/com/atproto/repo" ./lexicons/com/atproto

LEXICONS=$(find ./lexicons -name '*.json' -type f)
echo y | pnpm lex gen-api ./app/generated/api $LEXICONS
echo y | pnpm lex gen-server ./app/generated/server $LEXICONS

pnpm prisma generate
