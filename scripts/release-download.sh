#!/usr/bin/env bash
# Synchronised script: update ~/.dotfiles/sync/scripts/release-download.sh, then run
# ~/.dotfiles/script/dotfiles-sync.sh --sync scripts to refresh repo copies.
#
# Download the latest GitHub release asset for this repo into releases/.
# Repo-agnostic: the asset filename is the only input. Resolves the latest
# release via gh, downloads the matching asset, and writes a version-stamped
# copy so multiple releases can coexist locally.
#
# Usage:   ./scripts/release-download.sh <asset-filename>
# Example: ./scripts/release-download.sh acumatica-mcp-server.mcpb
#          ./scripts/release-download.sh acumatica-erp-plugin.zip
set -euo pipefail

asset="${1:-}"
if [ -z "${asset}" ]; then
  echo "usage: $(basename "$0") <asset-filename>" >&2
  exit 2
fi

stem="${asset%.*}"
ext="${asset##*.}"

mkdir -p releases
tag="$(gh release view --json tagName -q .tagName)"
# A component-prefixed tag (acumatica-mcp-server-v3.6.0) already embeds the
# asset stem; strip it so the stamped filename doesn't stutter. A bare tag
# (v3.6.0) has no such prefix, so this is a no-op there.
stamp="${tag#"${stem}-"}"
gh release download "${tag}" \
  --pattern "${asset}" \
  --output "releases/${stem}-${stamp}.${ext}" \
  --clobber

echo "Downloaded ${asset} from ${tag} -> releases/${stem}-${stamp}.${ext}"
