#!/usr/bin/env bash
# Synchronised script: update ~/.dotfiles/sync/scripts/shell-exec.sh, then run
# ~/.dotfiles/script/dotfiles-sync.sh --sync scripts to refresh repo copies.
# Execute commands in the correct shell environment.
#
# Handles five scenarios:
#   1. Claude Code cloud (CLAUDE_CODE_REMOTE=true): Use .nvmrc for Node version, run directly
#   2. Codex cloud with a pinned runtime (CODEX_ENV_* variables, set only when the
#      environment pins a language version): Run directly, Nix not available
#   3. Any other Codex agent shell (CODEX_CI=1, which Codex injects into every command
#      it runs locally or in cloud; Codex Desktop also sets CODEX_SHELL=1): Reuse cached
#      direnv env, else hydrate via direnv exec, else run directly
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
    return "$?"
  fi

  return 1
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

# Codex cloud with a pinned runtime: run directly (Nix not available).
if [[ -n "${CODEX_ENV_NODE_VERSION:-}" ]]; then
  exec "$@"
fi

# Codex agent shells block direct Nix daemon access. Reuse a cached direnv
# profile when present; otherwise allow and load this worktree's flake before
# dispatch. Codex cloud without a pinned runtime also lands here and has neither
# a cached profile nor direnv, so it falls through to direct dispatch.
if [[ -n "${CODEX_CI:-}" || -n "${CODEX_SHELL:-}" ]]; then
  if load_cached_direnv_profile; then
    exec "$@"
  fi

  if [[ -f "${repo_root}/.envrc" ]] && command -v direnv >/dev/null 2>&1; then
    direnv allow "${repo_root}/.envrc"
    exec direnv exec "${repo_root}" "$@"
  fi

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
