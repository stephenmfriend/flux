#!/usr/bin/env node
/**
 * Synchronised script: update ~/.dotfiles/sync/scripts/release-bundle-mcpb.mjs, then run
 * ~/.dotfiles/script/dotfiles-sync.sh --sync scripts to refresh repo copies.
 *
 * release-bundle-mcpb.mjs
 *
 * The pack half of the one MCPB bundling process: produces the .mcpb extension
 * bundle. Assumes the build step (mcpb-esbuild.mjs, run via `pnpm run build`)
 * has already emitted a self-contained dist/index.js, so no node_modules/ ships
 * in the bundle. This script stages the runtime artefacts (dist/, manifest.json,
 * icon.png, LICENSE) plus a minimal package.json and runs `mcpb pack`.
 *
 * Repo-agnostic — the bundle name and metadata are derived from package.json.
 */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The script lives at <repo>/scripts/, so the repo root is one level up —
// robust regardless of the working directory it's invoked from.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = join(ROOT, '.mcpb-build');
const RELEASES_DIR = join(ROOT, 'releases');

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
// Scoped names (@scope/name) carry a slash; left raw, OUTPUT would resolve under
// releases/@scope/ — a subdir that's never created — so mcpb pack fails or nests
// the asset. Flatten to a single safe filename under releases/.
const safePkgName = pkg.name.replace(/^@/, '').replace('/', '-');
const OUTPUT = join(RELEASES_DIR, `${safePkgName}.mcpb`);

console.error('Cleaning staging directory...');
rmSync(BUILD_DIR, { recursive: true, force: true });
mkdirSync(BUILD_DIR);
mkdirSync(RELEASES_DIR, { recursive: true });

console.error('Copying runtime artefacts...');
// dist/, manifest.json and icon.png are required; LICENSE is optional so the
// process works for WIP servers that don't ship a LICENSE file yet.
for (const asset of ['dist', 'manifest.json', 'icon.png']) {
  cpSync(join(ROOT, asset), join(BUILD_DIR, asset), { recursive: true });
}
if (existsSync(join(ROOT, 'LICENSE'))) {
  cpSync(join(ROOT, 'LICENSE'), join(BUILD_DIR, 'LICENSE'));
}

// dist/index.js calls `require('../package.json')` at runtime to read the
// version, so we still ship a package.json — but with no dependencies, since
// the bundle is self-contained.
const slim = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  type: pkg.type,
  main: pkg.main,
  scripts: { start: 'node dist/index.js' },
  engines: pkg.engines,
};

writeFileSync(join(BUILD_DIR, 'package.json'), `${JSON.stringify(slim, null, 2)}\n`);

writeFileSync(join(BUILD_DIR, '.mcpbignore'), '.DS_Store\n*.log\n*.mcpb\n');

// Invoke the locally-pinned @anthropic-ai/mcpb binary via pnpm exec rather than
// `npx`, which would silently download whatever the registry resolves at
// runtime if the dep weren't installed.
console.error('Packing extension bundle...');
execFileSync('pnpm', ['exec', 'mcpb', 'pack', BUILD_DIR, OUTPUT], {
  stdio: 'inherit',
});

console.error(`\nBundle ready: ${OUTPUT}`);
