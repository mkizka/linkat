#!/usr/bin/env bash
set -euo pipefail

pnpm lex install --ci
pnpm lex build --out ./app/generated --clear

pnpm prisma generate
