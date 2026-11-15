#!/usr/bin/env bash
# Synchronised script: update ~/.dotfiles/sync/scripts/release-bundle-plugin.sh, then run
# ~/.dotfiles/script/dotfiles-sync.sh --sync scripts to refresh repo copies.
#
# Bundle a Claude plugin repo into releases/<asset> — a .zip of the canonical
# plugin layout. Repo-agnostic: the zip name is the only input.
#
# Usage:   ./scripts/release-bundle-plugin.sh <asset-filename.zip>
# Example: ./scripts/release-bundle-plugin.sh acumatica-erp-plugin.zip
set -euo pipefail

asset="${1:-}"
if [ -z "${asset}" ]; then
  echo "usage: $(basename "$0") <asset-filename.zip>" >&2
  exit 2
fi

mkdir -p releases
rm -f "releases/${asset}"
zip -r "releases/${asset}" \
  .claude-plugin/ \
  skills/ \
  README.md \
  LICENSE \
  -x '*.DS_Store' '*__pycache__*' '*.pyc'

echo "Bundled plugin -> releases/${asset}"
