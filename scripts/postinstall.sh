#!/usr/bin/env bash
set -euo pipefail

ATPROTO_COMMIT=f2f8de63b333448d87c364578e023ddbb63b8b25

# git submoduleを使うとRailwayで動作しないため、gigetを使ってatprotoを取得する
if [ ! -d atproto ]; then
  # https://github.com/bluesky-social/atproto/commit/f2f8de63b333448d87c364578e023ddbb63b8b25
  pnpm giget gh:bluesky-social/atproto#$ATPROTO_COMMIT atproto
fi
mkdir -p ./lexicons/com/atproto
cp -r ./atproto/lexicons/com/atproto/repo ./lexicons/com/atproto

LEXICONS=$(find ./lexicons -name '*.json' -type f)
echo y | pnpm lex gen-api ./app/generated/api $LEXICONS
echo y | pnpm lex gen-server ./app/generated/server $LEXICONS

pnpm prisma generate
