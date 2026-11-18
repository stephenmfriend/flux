#!/usr/bin/env bash
# Install or verify the release binaries pinned in a repo's tooling/pinned-tools.env.
#
# Usage:
#   scripts/pinned-tools.sh install [tool...]   download the pinned releases into bin/tools
#   scripts/pinned-tools.sh check   [tool...]   fail unless each tool on PATH is the
#                                               bin/tools binary at the pinned version
#
# Synced from ~/.dotfiles/sync/scripts/pinned-tools.sh by script/dotfiles-sync.sh.
# Do not edit a repo's copy: change the canonical file in dotfiles and re-sync.
#
# The manifest is the single owner of each tool's version. CI and local shells
# run the same installer, so the gate executes identical releases everywhere;
# `check` makes a stale or shadowing binary a hard failure instead of a silent
# difference between a green local gate and a red CI run.
#
# With no tool names, every tool the manifest pins is processed. A repo pins
# only the tools it uses. Manifest format, one tool per line, with the
# annotation Renovate reads to bump it:
#
#   # renovate: datasource=github-releases depName=errata-ai/vale extractVersion=^v(?<version>.+)$
#   VALE_VERSION=3.14.2
#
# Tools and their manifest keys:
#   golangci-lint GOLANGCI_LINT_VERSION   hugo     HUGO_VERSION
#   pagefind      PAGEFIND_VERSION        terraform TERRAFORM_VERSION
#   vale          VALE_VERSION            rg       RIPGREP_VERSION
#   yq            YQ_VERSION              gitleaks GITLEAKS_VERSION
#   osv-scanner   OSV_SCANNER_VERSION     task     TASK_VERSION (go-task)
#
# install verifies every download against the checksum the tool's maintainers
# publish with the release, before anything is extracted or made executable.
# A mismatch or a missing checksum entry installs nothing.
#
# Written for bash 3.2: a macOS shell outside Nix resolves `env bash` to
# /bin/bash, so no associative arrays or mapfile.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
manifest="${repo_root}/tooling/pinned-tools.env"
tools_dir="${repo_root}/bin/tools"
stamp_dir="${tools_dir}/.pinned"

ALL_TOOLS="golangci-lint hugo pagefind terraform vale rg yq gitleaks osv-scanner task"

usage() {
  echo "usage: $0 install|check [tool...]" >&2
  echo "tools: ${ALL_TOOLS}" >&2
  exit 2
}

manifest_key() {
  case "$1" in
  golangci-lint) echo GOLANGCI_LINT_VERSION ;;
  hugo) echo HUGO_VERSION ;;
  pagefind) echo PAGEFIND_VERSION ;;
  terraform) echo TERRAFORM_VERSION ;;
  vale) echo VALE_VERSION ;;
  rg) echo RIPGREP_VERSION ;;
  yq) echo YQ_VERSION ;;
  gitleaks) echo GITLEAKS_VERSION ;;
  osv-scanner) echo OSV_SCANNER_VERSION ;;
  task) echo TASK_VERSION ;;
  *)
    echo "pinned-tools: unknown tool '$1'" >&2
    usage
    ;;
  esac
}

# manifest_value prints the value of KEY=VALUE line $1, or nothing. The manifest
# is parsed, not sourced, so an exported variable of the same name (a CI step's
# VALE_VERSION, say) can never put a tool in scope that the manifest omits.
# Pure bash, so `check` needs no utility beyond grep and head.
manifest_value() {
  local line value=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    case "$line" in "$1="*) value="${line#*=}" ;; esac
  done <"$manifest"
  echo "$value"
}

# pinned_version prints the manifest version of tool $1, failing when the
# manifest does not pin it or the value is not a plain version string (it is
# interpolated into download URLs and file paths).
pinned_version() {
  local key version
  key=$(manifest_key "$1")
  version=$(manifest_value "$key")
  if [[ -z "$version" ]]; then
    echo "pinned-tools: ${manifest} does not pin $1 (no ${key} line)" >&2
    return 1
  fi
  if [[ ! "$version" =~ ^[0-9A-Za-z][0-9A-Za-z.+-]*$ ]]; then
    echo "pinned-tools: ${key}='${version}' in ${manifest} is not a version" >&2
    return 1
  fi
  echo "$version"
}

# manifest_tools prints the tools the manifest pins, in ALL_TOOLS order.
manifest_tools() {
  local tool
  for tool in $ALL_TOOLS; do
    [[ -n "$(manifest_value "$(manifest_key "$tool")")" ]] && echo "$tool"
  done
  return 0
}

# version_output prints the line holding the tool's own version string.
version_output() {
  case "$1" in
  golangci-lint | gitleaks | hugo | terraform) "$2" version 2>&1 | head -1 ;;
  *) "$2" --version 2>&1 | head -1 ;;
  esac
}

detect_platform() {
  case "$(uname -s)" in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *)
    echo "pinned-tools: unsupported OS $(uname -s)" >&2
    exit 1
    ;;
  esac
  case "$(uname -m)" in
  x86_64 | amd64) arch=amd64 ;;
  arm64 | aarch64) arch=arm64 ;;
  *)
    echo "pinned-tools: unsupported architecture $(uname -m)" >&2
    exit 1
    ;;
  esac
}

# release_recipe sets, for tool $1 at version $2 on $os/$arch:
#   asset_url     the release file to download
#   checksum_url  the maintainers' published checksum file covering it
#   asset_is_binary  "yes" when the download is the executable itself
release_recipe() {
  local tool="$1" v="$2"
  local gnu_arch rust_os rust_arch base
  gnu_arch=$([[ $arch == amd64 ]] && echo x86_64 || echo aarch64)
  rust_os=$([[ $os == darwin ]] && echo apple-darwin || echo unknown-linux-musl)
  asset_is_binary=no
  case "$tool" in
  golangci-lint)
    base="https://github.com/golangci/golangci-lint/releases/download/v${v}"
    asset_url="${base}/golangci-lint-${v}-${os}-${arch}.tar.gz"
    checksum_url="${base}/golangci-lint-${v}-checksums.txt"
    ;;
  hugo)
    base="https://github.com/gohugoio/hugo/releases/download/v${v}"
    if [[ $os == darwin ]]; then
      asset_url="${base}/hugo_extended_${v}_darwin-universal.pkg"
    else
      asset_url="${base}/hugo_extended_${v}_linux-${arch}.tar.gz"
    fi
    checksum_url="${base}/hugo_${v}_checksums.txt"
    ;;
  pagefind)
    base="https://github.com/Pagefind/pagefind/releases/download/v${v}"
    asset_url="${base}/pagefind-v${v}-${gnu_arch}-${rust_os}.tar.gz"
    checksum_url="${asset_url}.sha256"
    ;;
  terraform)
    base="https://releases.hashicorp.com/terraform/${v}"
    asset_url="${base}/terraform_${v}_${os}_${arch}.zip"
    checksum_url="${base}/terraform_${v}_SHA256SUMS"
    ;;
  vale)
    local vale_os vale_arch
    vale_os=$([[ $os == darwin ]] && echo macOS || echo Linux)
    vale_arch=$([[ $arch == amd64 ]] && echo 64-bit || echo arm64)
    base="https://github.com/errata-ai/vale/releases/download/v${v}"
    asset_url="${base}/vale_${v}_${vale_os}_${vale_arch}.tar.gz"
    checksum_url="${base}/vale_${v}_checksums.txt"
    ;;
  rg)
    # ripgrep publishes no musl build for Linux arm64; its gnu build is the only one.
    rust_arch="$gnu_arch"
    if [[ $os == linux && $arch == arm64 ]]; then
      rust_os=unknown-linux-gnu
    fi
    asset_url="https://github.com/BurntSushi/ripgrep/releases/download/${v}/ripgrep-${v}-${rust_arch}-${rust_os}.tar.gz"
    checksum_url="${asset_url}.sha256"
    ;;
  yq)
    base="https://github.com/mikefarah/yq/releases/download/v${v}"
    asset_url="${base}/yq_${os}_${arch}"
    checksum_url="${base}/checksums-bsd"
    asset_is_binary=yes
    ;;
  gitleaks)
    local leaks_arch
    leaks_arch=$([[ $arch == amd64 ]] && echo x64 || echo arm64)
    base="https://github.com/gitleaks/gitleaks/releases/download/v${v}"
    asset_url="${base}/gitleaks_${v}_${os}_${leaks_arch}.tar.gz"
    checksum_url="${base}/gitleaks_${v}_checksums.txt"
    ;;
  osv-scanner)
    base="https://github.com/google/osv-scanner/releases/download/v${v}"
    asset_url="${base}/osv-scanner_${os}_${arch}"
    checksum_url="${base}/osv-scanner_SHA256SUMS"
    asset_is_binary=yes
    ;;
  task)
    base="https://github.com/go-task/task/releases/download/v${v}"
    asset_url="${base}/task_${os}_${arch}.tar.gz"
    checksum_url="${base}/task_checksums.txt"
    ;;
  esac
}

# download fetches $1 to $2 completely before anything reads it. Retries cover
# connection resets and transient HTTP failures on shared CI runners, and
# writing to a file (never a pipe into tar) means a failed attempt can never
# be extracted half-written.
download() {
  curl --fail --silent --show-error --location \
    --retry 5 --retry-all-errors --retry-delay 2 --connect-timeout 20 \
    --output "$2" "$1"
}

# published_sha256 prints the SHA-256 that checksum file $1 lists for asset $2.
# It reads the GNU format ("<hash>  <name>", "*<name>" in binary mode) and the
# BSD format ("SHA256 (<name>) = <hash>", yq's checksums-bsd).
published_sha256() {
  awk -v name="$2" '
    $1 == "SHA256" && $2 == "(" name ")" && $3 == "=" && NF == 4 { print $4; next }
    NF == 2 { file = $2; sub(/^\*/, "", file); if (file == name) print $1 }
  ' "$1"
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{ print $1 }'
  else
    shasum -a 256 "$1" | awk '{ print $1 }'
  fi
}

# verify_checksum fails unless asset $1 matches exactly one well-formed entry
# for it in checksum file $2.
verify_checksum() {
  local asset="$1" sums="$2" name expected actual
  name=$(basename "$asset")
  expected=$(published_sha256 "$sums" "$name")
  if [[ ! "$expected" =~ ^[0-9a-fA-F]{64}$ ]]; then
    echo "pinned-tools: no single SHA-256 entry for ${name} in $(basename "$sums")" >&2
    return 1
  fi
  actual=$(sha256_of "$asset")
  if [[ "$(echo "$actual" | tr 'A-F' 'a-f')" != "$(echo "$expected" | tr 'A-F' 'a-f')" ]]; then
    echo "pinned-tools: checksum mismatch for ${name}: got ${actual}, published ${expected}" >&2
    return 1
  fi
}

install_tool() {
  local tool="$1" version work archive sums binary
  version=$(pinned_version "$tool")
  if [[ -x "${tools_dir}/${tool}" && "$(cat "${stamp_dir}/${tool}" 2>/dev/null)" == "$version" ]]; then
    echo "  ${tool} ${version} — already installed"
    return 0
  fi

  release_recipe "$tool" "$version"
  work="${work_root}/${tool}"
  mkdir -p "${work}/extract"
  archive="${work}/$(basename "$asset_url")"
  sums="${work}/checksums"
  download "$asset_url" "$archive"
  download "$checksum_url" "$sums"
  verify_checksum "$archive" "$sums"

  if [[ $asset_is_binary == yes ]]; then
    binary="$archive"
  else
    case "$archive" in
    *.tar.gz) tar -xzf "$archive" -C "${work}/extract" ;;
    *.zip) unzip -q "$archive" -d "${work}/extract" ;;
    *.pkg) pkgutil --expand-full "$archive" "${work}/extract/pkg" ;;
    esac
    binary=$(find "${work}/extract" -type f -name "$tool" -perm -u+x | head -1)
  fi
  if [[ -z "$binary" ]]; then
    echo "pinned-tools: no '${tool}' executable inside $(basename "$asset_url")" >&2
    return 1
  fi

  mkdir -p "$tools_dir" "$stamp_dir"
  install -m 0755 "$binary" "${tools_dir}/${tool}.tmp"
  mv -f "${tools_dir}/${tool}.tmp" "${tools_dir}/${tool}"
  echo "$version" >"${stamp_dir}/${tool}"
  echo "  ${tool} ${version} — installed"
}

check_tool() {
  local tool="$1" version resolved actual
  # check_tool runs under `|| failed=1`, where errexit is off, so a failed
  # lookup must return explicitly.
  version=$(pinned_version "$tool") || return 1
  resolved=$(command -v "$tool" || true)
  if [[ -z "$resolved" ]]; then
    echo "  ${tool}: not on PATH (want ${version} in ${tools_dir})" >&2
    return 1
  fi
  if [[ "$resolved" != "${tools_dir}/${tool}" ]]; then
    echo "  ${tool}: PATH resolves ${resolved}, not ${tools_dir}/${tool}" >&2
    return 1
  fi
  actual=$(version_output "$tool" "$resolved" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
  if [[ "$actual" != "$version" ]]; then
    echo "  ${tool}: ${resolved} reports ${actual:-no version}, want ${version}" >&2
    return 1
  fi
  echo "  ${tool} ${version} — OK"
}

[[ $# -ge 1 ]] || usage
mode="$1"
shift
[[ $mode == install || $mode == check ]] || usage

if [[ ! -f "$manifest" ]]; then
  echo "pinned-tools: no manifest at ${manifest}" >&2
  exit 1
fi

if [[ $# -gt 0 ]]; then
  # Outside a command substitution, so an unknown name exits through usage.
  for tool in "$@"; do
    manifest_key "$tool" >/dev/null
  done
  tools="$*"
else
  tools=$(manifest_tools)
fi
if [[ -z "$tools" ]]; then
  echo "pinned-tools: ${manifest} pins no tools" >&2
  exit 1
fi

case "$mode" in
install)
  detect_platform
  work_root=$(mktemp -d)
  trap 'rm -rf "$work_root"' EXIT
  for tool in $tools; do
    install_tool "$tool"
  done
  ;;
check)
  failed=0
  for tool in $tools; do
    check_tool "$tool" || failed=1
  done
  if [[ $failed -ne 0 ]]; then
    echo "ERROR: pinned tools differ from tooling/pinned-tools.env — run '$0 install'." >&2
    echo "       Every pinned tool must resolve from ${tools_dir} so CI and local run the same release." >&2
    exit 1
  fi
  ;;
esac
