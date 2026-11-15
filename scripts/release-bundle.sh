#!/usr/bin/env bash
# Synchronised script: update ~/.dotfiles/sync/scripts/release-bundle.sh, then run
# ~/.dotfiles/script/dotfiles-sync.sh --sync scripts to refresh repo copies.
#
# The one release-bundle entry point — repo-type-aware. Detects the repo shape
# and produces the release asset under releases/:
#   - Claude plugin (.claude-plugin/plugin.json present) -> .zip via release-bundle-plugin.sh
#   - MCPB server   (manifest.json present)              -> .mcpb via release-bundle-mcpb.mjs
#
# Usage:   ./scripts/release-bundle.sh [<asset-filename>]
#   Plugin repos: the zip name is required (asset names don't derive cleanly).
#   MCPB repos:   no argument — the .mcpb name is derived from package.json.
#                 dist/ must already be built (`pnpm run build`).
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f .claude-plugin/plugin.json ]; then
  asset="${1:-}"
  if [ -z "${asset}" ]; then
    echo "release-bundle: plugin repo — asset filename (e.g. foo-plugin.zip) is required" >&2
    exit 2
  fi
  exec "${here}/release-bundle-plugin.sh" "${asset}"
elif [ -f manifest.json ]; then
  exec node "${here}/release-bundle-mcpb.mjs"
else
  echo "release-bundle: cannot determine repo type (no .claude-plugin/plugin.json or manifest.json)" >&2
  exit 1
fi
