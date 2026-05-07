#!/usr/bin/env bash
# Dworks git hooks 설치 스크립트.
# 사용법: bash scripts/install-hooks.sh
# 멱등 — 여러 번 실행해도 안전.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
HOOK_DIR="$ROOT/.git/hooks"
SRC_DIR="$ROOT/scripts/hooks"

if [ ! -d "$SRC_DIR" ]; then
  echo "hook source dir not found: $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$HOOK_DIR"

for src in "$SRC_DIR"/*; do
  name="$(basename "$src")"
  dst="$HOOK_DIR/$name"
  cp "$src" "$dst"
  chmod +x "$dst"
  echo "installed: $dst"
done

echo "done."
