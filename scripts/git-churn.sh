#!/usr/bin/env bash
# Synchronised script: update ~/.dotfiles/sync/scripts/git-churn.sh, then run
# ~/.dotfiles/script/dotfiles-sync.sh --sync scripts to refresh repo copies.
set -euo pipefail

script_name=$(basename "$0")

usage() {
  cat <<EOF
Usage: ${script_name} [MODE]

Modes:
  days              Last 8 days, one row per day (default)
  weeks             Last 5 weeks, one row per week
  months            Last 13 months, one row per month
  range FROM TO     Custom date range (YYYY-MM-DD)

Categories:
  Go        *.go, excluding tests and generated files
  GoTest    *_test.go
  GoGen     generated Go files such as *_gen.go, *_templ.go, *.pb.go
  Templ     *.templ
  CUE       *.cue
  TS        *.ts, *.tsx, *.mts, *.cts
  JS        *.js, *.jsx, *.mjs, *.cjs
  JSON      *.json, *.jsonc
  YAML      *.yaml, *.yml
  MD        *.md, *.mdx
  Shell     shell scripts
  Config    common repo configuration and lockfiles
  Other     everything else
EOF
  exit 0
}

# Paths excluded from churn counts: generated dependencies, local state, build
# outputs, caches, and vendored binaries that obscure source-code movement.
exclude_paths=(
  ".git/"
  ".local/"
  ".cache/"
  ".direnv/"
  ".next/"
  ".nuxt/"
  ".turbo/"
  ".vite/"
  "bin/tools/"
  "build/"
  "coverage/"
  "data/"
  "dist/"
  "node_modules/"
  "vendor/"
)

mode="${1:-days}"
if [[ $# -gt 0 ]]; then shift; fi

from=""
to=""

case "$mode" in
days)
  since="8 days ago"
  date_fmt="%Y-%m-%d"
  ;;
weeks)
  since="5 weeks ago"
  date_fmt="%G-W%V"
  ;;
months)
  since="13 months ago"
  date_fmt="%Y-%m"
  ;;
range)
  if [[ $# -lt 2 ]]; then
    echo "Usage: ${script_name} range FROM TO (YYYY-MM-DD)" >&2
    exit 1
  fi
  from="$1"
  to="$2"
  since=""
  date_fmt="total"
  ;;
-h | --help | help)
  usage
  ;;
*)
  echo "Unknown mode: $mode" >&2
  echo "Run '${script_name} --help' for usage." >&2
  exit 1
  ;;
esac

git_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "${script_name}: not inside a git repository" >&2
  exit 1
}
cd "$git_root"

path_filters=(--)
for path in "${exclude_paths[@]}"; do
  path_filters+=(":!$path")
done

git_log_args=(log --no-merges --numstat "--format=COMMIT:%ad")
count_args=(log --no-merges --oneline)

if [[ -n "${since:-}" ]]; then
  git_log_args+=("--date=format:$date_fmt" "--since=$since")
  count_args+=("--since=$since")
else
  git_log_args+=("--date=format:$date_fmt" "--after=${from}T00:00:00" "--before=${to}T23:59:59")
  count_args+=("--after=${from}T00:00:00" "--before=${to}T23:59:59")
fi

git_log_args+=("${path_filters[@]}")
count_args+=("${path_filters[@]}")

commit_count=$(git "${count_args[@]}" | wc -l | tr -d ' ')

if [[ "$commit_count" -eq 0 ]]; then
  echo ""
  echo "No commits in this period."
  exit 0
fi

echo ""
case "$mode" in
days) echo "Git Churn - last 8 days ($commit_count commits)" ;;
weeks) echo "Git Churn - last 5 weeks ($commit_count commits)" ;;
months) echo "Git Churn - last 13 months ($commit_count commits)" ;;
range) echo "Git Churn - $from to $to ($commit_count commits)" ;;
esac
echo ""

git "${git_log_args[@]}" | awk '
function init_categories() {
  ncats = 13
  cats[1] = "go";     hdr[1] = "Go"
  cats[2] = "gotest"; hdr[2] = "GoTest"
  cats[3] = "gogen";  hdr[3] = "GoGen"
  cats[4] = "templ";  hdr[4] = "Templ"
  cats[5] = "cue";    hdr[5] = "CUE"
  cats[6] = "ts";     hdr[6] = "TS"
  cats[7] = "js";     hdr[7] = "JS"
  cats[8] = "json";   hdr[8] = "JSON"
  cats[9] = "yaml";   hdr[9] = "YAML"
  cats[10] = "md";    hdr[10] = "MD"
  cats[11] = "shell"; hdr[11] = "Shell"
  cats[12] = "config"; hdr[12] = "Config"
  cats[13] = "other"; hdr[13] = "Other"
}

function basename(path,    n, parts) {
  n = split(path, parts, "/")
  return parts[n]
}

function categorise(f,    b) {
  b = basename(f)
  if (f ~ /_templ\.go$/) return "gogen"
  if (f ~ /_gen\.go$/) return "gogen"
  if (f ~ /_string\.go$/) return "gogen"
  if (f ~ /_enumer\.go$/) return "gogen"
  if (f ~ /_mock\.go$/) return "gogen"
  if (f ~ /\.pb\.go$/) return "gogen"
  if (f ~ /_test\.go$/) return "gotest"
  if (f ~ /\.go$/) return "go"
  if (f ~ /\.templ$/) return "templ"
  if (f ~ /\.cue$/) return "cue"
  if (b ~ /^(Dockerfile|Containerfile|Makefile|Taskfile\.(yml|yaml)|go\.mod|go\.sum|package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|bun\.lock|tsconfig.*\.json|vite\.config\..*|biome\.json|eslint\.config\..*|prettier\.config\..*)$/) return "config"
  if (b ~ /^(\.env.*|\.gitignore|\.dockerignore|\.editorconfig|\.npmrc|\.nvmrc)$/) return "config"
  if (f ~ /\.(toml|ini|conf|cfg|lock)$/) return "config"
  if (f ~ /\.(ts|tsx|mts|cts)$/) return "ts"
  if (f ~ /\.(js|jsx|mjs|cjs)$/) return "js"
  if (f ~ /\.(json|jsonc)$/) return "json"
  if (f ~ /\.(yaml|yml)$/) return "yaml"
  if (f ~ /\.(md|mdx)$/) return "md"
  if (f ~ /\.(sh|bash|zsh)$/) return "shell"
  if (f ~ /(^|\/)(script|scripts)\//) return "shell"
  return "other"
}

function sort_buckets(    i, j, tmp) {
  for (i = 2; i <= nbuckets; i++) {
    tmp = bucket_list[i]
    j = i - 1
    while (j > 0 && bucket_list[j] > tmp) {
      bucket_list[j + 1] = bucket_list[j]
      j--
    }
    bucket_list[j + 1] = tmp
  }
}

function abs(v) { return v < 0 ? -v : v }

function pct_bar(val, total,    barw, filled, s, i) {
  barw = 40
  if (total == 0) return ""
  filled = int(val * barw / total + 0.5)
  if (filled == 0 && val > 0) filled = 1
  s = ""
  for (i = 0; i < filled; i++) s = s "#"
  for (i = filled; i < barw; i++) s = s "."
  return s
}

BEGIN {
  init_categories()
}

/^COMMIT:/ {
  bucket = substr($0, 8)
  if (!(bucket in bucket_seen)) {
    bucket_seen[bucket] = 1
    bucket_list[++nbuckets] = bucket
  }
  next
}

/^[0-9]/ {
  a = $1 + 0
  r = $2 + 0
  file = ""
  for (i = 3; i <= NF; i++) file = file (i > 3 ? " " : "") $i
  cat = categorise(file)

  add[bucket, cat] += a
  del[bucket, cat] += r

  if (!((bucket, cat, file) in file_seen)) {
    file_seen[bucket, cat, file] = 1
    files[bucket, cat]++
    total_files++
  }
  next
}

END {
  sort_buckets()

  printf "%-12s", "Period"
  for (c = 1; c <= ncats; c++) printf " %8s", hdr[c]
  printf " %9s\n", "Total"

  sep = "------------"
  for (c = 1; c <= ncats; c++) sep = sep "---------"
  sep = sep "----------"
  print sep

  for (b = 1; b <= nbuckets; b++) {
    bk = bucket_list[b]
    printf "%-12s", bk
    row_add = 0; row_del = 0
    for (c = 1; c <= ncats; c++) {
      a = add[bk, cats[c]] + 0
      d = del[bk, cats[c]] + 0
      row_add += a; row_del += d
      if (a == 0 && d == 0) {
        printf " %8s", "."
      } else {
        printf " %+8d", a - d
      }
    }
    printf " %+9d\n", row_add - row_del
  }

  print sep
  printf "%-12s", "Total"
  grand_add = 0; grand_del = 0
  for (c = 1; c <= ncats; c++) {
    cat_add = 0; cat_del = 0
    for (b = 1; b <= nbuckets; b++) {
      cat_add += add[bucket_list[b], cats[c]] + 0
      cat_del += del[bucket_list[b], cats[c]] + 0
    }
    cat_net[c] = cat_add - cat_del
    grand_add += cat_add; grand_del += cat_del
    if (cat_add == 0 && cat_del == 0) {
      printf " %8s", "."
    } else {
      printf " %+8d", cat_net[c]
    }
  }
  grand_net = grand_add - grand_del
  printf " %+9d\n", grand_net

  printf "\n%d files changed\n", total_files

  chart_total = 0
  for (c = 1; c <= ncats; c++) chart_total += abs(cat_net[c])

  if (chart_total > 0) {
    printf "\n"
    for (c = 1; c <= ncats; c++) {
      v = abs(cat_net[c])
      if (v == 0) continue
      pct = v * 100 / chart_total
      printf "  %-7s %s %4.1f%%\n", hdr[c], pct_bar(v, chart_total), pct
    }
    printf "\n"
  }
}
'

echo "Current totals (working tree)"
echo ""

{ git ls-files -z "${path_filters[@]}" | xargs -0 wc -l 2>/dev/null || true; } | awk '
function init_categories() {
  ncats = 13
  cats[1] = "go";     hdr[1] = "Go"
  cats[2] = "gotest"; hdr[2] = "GoTest"
  cats[3] = "gogen";  hdr[3] = "GoGen"
  cats[4] = "templ";  hdr[4] = "Templ"
  cats[5] = "cue";    hdr[5] = "CUE"
  cats[6] = "ts";     hdr[6] = "TS"
  cats[7] = "js";     hdr[7] = "JS"
  cats[8] = "json";   hdr[8] = "JSON"
  cats[9] = "yaml";   hdr[9] = "YAML"
  cats[10] = "md";    hdr[10] = "MD"
  cats[11] = "shell"; hdr[11] = "Shell"
  cats[12] = "config"; hdr[12] = "Config"
  cats[13] = "other"; hdr[13] = "Other"
}

function basename(path,    n, parts) {
  n = split(path, parts, "/")
  return parts[n]
}

function categorise(f,    b) {
  b = basename(f)
  if (f ~ /_templ\.go$/) return "gogen"
  if (f ~ /_gen\.go$/) return "gogen"
  if (f ~ /_string\.go$/) return "gogen"
  if (f ~ /_enumer\.go$/) return "gogen"
  if (f ~ /_mock\.go$/) return "gogen"
  if (f ~ /\.pb\.go$/) return "gogen"
  if (f ~ /_test\.go$/) return "gotest"
  if (f ~ /\.go$/) return "go"
  if (f ~ /\.templ$/) return "templ"
  if (f ~ /\.cue$/) return "cue"
  if (b ~ /^(Dockerfile|Containerfile|Makefile|Taskfile\.(yml|yaml)|go\.mod|go\.sum|package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|bun\.lock|tsconfig.*\.json|vite\.config\..*|biome\.json|eslint\.config\..*|prettier\.config\..*)$/) return "config"
  if (b ~ /^(\.env.*|\.gitignore|\.dockerignore|\.editorconfig|\.npmrc|\.nvmrc)$/) return "config"
  if (f ~ /\.(toml|ini|conf|cfg|lock)$/) return "config"
  if (f ~ /\.(ts|tsx|mts|cts)$/) return "ts"
  if (f ~ /\.(js|jsx|mjs|cjs)$/) return "js"
  if (f ~ /\.(json|jsonc)$/) return "json"
  if (f ~ /\.(yaml|yml)$/) return "yaml"
  if (f ~ /\.(md|mdx)$/) return "md"
  if (f ~ /\.(sh|bash|zsh)$/) return "shell"
  if (f ~ /(^|\/)(script|scripts)\//) return "shell"
  return "other"
}

function pct_bar(val, total,    barw, filled, s, i) {
  barw = 40
  if (total == 0) return ""
  filled = int(val * barw / total + 0.5)
  if (filled == 0 && val > 0) filled = 1
  s = ""
  for (i = 0; i < filled; i++) s = s "#"
  for (i = filled; i < barw; i++) s = s "."
  return s
}

BEGIN {
  init_categories()
}

NF >= 2 {
  if (NF == 2 && $2 == "total") next

  lines = $1 + 0
  file = $2
  for (i = 3; i <= NF; i++) file = file " " $i

  cat = categorise(file)
  cat_lines[cat] += lines
  cat_files[cat]++
  total_lines += lines
  total_files++
}

END {
  sep = "--------- ---------- --------"
  printf "%-9s %10s %8s\n", "Category", "Lines", "Files"
  print sep
  for (c = 1; c <= ncats; c++) {
    l = cat_lines[cats[c]] + 0
    f = cat_files[cats[c]] + 0
    printf "%-9s %10d %8d\n", hdr[c], l, f
  }
  print sep
  printf "%-9s %10d %8d\n", "Total", total_lines, total_files

  if (total_lines > 0) {
    printf "\n"
    for (c = 1; c <= ncats; c++) {
      v = cat_lines[cats[c]] + 0
      if (v == 0) continue
      pct = v * 100 / total_lines
      printf "  %-7s %s %4.1f%%\n", hdr[c], pct_bar(v, total_lines), pct
    }
    printf "\n"
  }
}
'
