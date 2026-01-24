#!/usr/bin/env bash
set -euo pipefail

ATPROTO_COMMIT=$(cat .atproto-version)
ATPROTO_DIR="$HOME/.cache/atproto/$ATPROTO_COMMIT"

cd "$ATPROTO_DIR" && make run-dev-env
