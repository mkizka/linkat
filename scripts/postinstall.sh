#!/usr/bin/env bash
set -euo pipefail

pnpm lex install --ci --lexicons ./lexicons
pnpm lex build --lexicons ./lexicons --out ./app/generated --clear

pnpm prisma generate
