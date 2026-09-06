#!/usr/bin/env bash
set -euo pipefail

pnpm lex build --lexicons ./lexicons --out ./app/generated --clear

pnpm prisma generate
