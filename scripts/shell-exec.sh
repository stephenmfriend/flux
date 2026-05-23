#!/usr/bin/env bash
# Synchronised script: update ~/.dotfiles/sync/scripts/shell-exec.sh, then run
# ~/.dotfiles/script/dotfiles-sync.sh --sync scripts to refresh repo copies.
# Execute commands in the correct shell environment.
#
# Handles five scenarios:
#   1. Claude Code cloud (CLAUDE_CODE_REMOTE=true): Use .nvmrc for Node version, run directly
#   2. Codex cloud (CODEX_ENV_* variables): Run directly, Nix not available
#   3. Codex Desktop sandbox (CODEX_CI or CODEX_SHELL): Reuse cached direnv env, run directly
#   4. Already in Nix shell: Ensure Nix paths prioritised, run directly
#   5. Outside Nix: Enter nix develop first when the repo has a flake
#
# Usage: ./shell-exec.sh <command> [args...]
# Example: ./shell-exec.sh pnpm run test
#          ./shell-exec.sh task docs:lint

set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <command> [args...]" >&2
  exit 1
fi

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
repo_root="${SHELL_EXEC_REPO_ROOT:-$(cd "${script_dir}/.." && pwd -P)}"

prepend_path_if_dir() {
  local path_entry="$1"

  if [[ -d "$path_entry" ]]; then
    export PATH="${path_entry}:${PATH}"
  fi
}

prepend_repo_tool_paths() {
  prepend_path_if_dir "${repo_root}/bin/tools"
  prepend_path_if_dir "${repo_root}/node_modules/.bin"
}

load_cached_direnv_profile() {
  local direnv_rc
  local selected_rc=""

  for direnv_rc in "${repo_root}"/.direnv/flake-profile-*.rc; do
    if [[ -f "$direnv_rc" && (-z "$selected_rc" || "$direnv_rc" -nt "$selected_rc") ]]; then
      selected_rc="$direnv_rc"
    fi
  done

  if [[ -n "$selected_rc" ]]; then
    # shellcheck source=/dev/null
    source "$selected_rc" >/dev/null 2>&1
    return
  fi
}

prepend_repo_tool_paths

# Claude Code cloud: add project-specified Node version to PATH if available
if [[ "${CLAUDE_CODE_REMOTE:-}" == "true" ]]; then
  if [[ -f "${repo_root}/.nvmrc" ]]; then
    node_major=$(cut -d. -f1 <"${repo_root}/.nvmrc")
    if [[ -d "/opt/node${node_major}/bin" ]]; then
      export PATH="/opt/node${node_major}/bin:$PATH"
    fi
  fi
  exec "$@"
fi

# Codex cloud: run directly (Nix not available).
if [[ -n "${CODEX_ENV_NODE_VERSION:-}" ]]; then
  exec "$@"
fi

# Codex Desktop blocks direct Nix daemon access, but the cached direnv profile
# can still provide the pinned toolchain when the worktree has been hydrated.
if [[ -n "${CODEX_CI:-}" || -n "${CODEX_SHELL:-}" ]]; then
  load_cached_direnv_profile
  exec "$@"
fi

# If already in Nix shell, ensure Nix paths are first then run directly
if [[ -n "${IN_NIX_SHELL:-}" ]]; then
  # Reorder PATH to prioritise Nix store paths (handles tools that mangle PATH)
  nix_paths=$(echo "$PATH" | tr ':' '\n' | grep '^/nix/store' | tr '\n' ':')
  other_paths=$(echo "$PATH" | tr ':' '\n' | grep -v '^/nix/store' | tr '\n' ':')
  export PATH="${nix_paths}${other_paths%:}"
  exec "$@"
fi

# Otherwise, enter nix develop first for flake-backed repos.
if [[ ! -f "${repo_root}/flake.nix" ]]; then
  exec "$@"
fi

exec /nix/var/nix/profiles/default/bin/nix develop --command "$@"
