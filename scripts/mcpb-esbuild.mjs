#!/usr/bin/env node
/**
 * Synchronised script: update ~/.dotfiles/sync/scripts/mcpb-esbuild.mjs, then run
 * ~/.dotfiles/script/dotfiles-sync.sh --sync scripts to refresh repo copies.
 *
 * mcpb-esbuild.mjs
 *
 * The build half of the one MCPB bundling process: bundles src/index.ts into a
 * single self-contained dist/index.js via esbuild, so no node_modules/ ships in
 * the .mcpb. release-bundle-mcpb.mjs stages that dist/ and packs it.
 *
 * Repo-agnostic — every mcp-core MCPB server shares the same shape:
 *   - src/index.ts entry point
 *   - @napi-rs/keyring is a native (.node) module, marked external (esbuild has
 *     no loader for .node, and a platform-specific binary can't ship
 *     cross-platform in a single bundle). mcp-core loads it via a lazy dynamic
 *     import, so the bundle starts cleanly without it; the OS-keychain key
 *     source is then unavailable inside the packaged extension and the AES key
 *     is taken from MCP_TOKEN_STORE_KEY instead.
 *
 * The createRequire banner exposes a real Node require so bundled CJS deps
 * (Ajv, Express middleware, etc.) that call require('path')/require('fs') at
 * runtime succeed under esbuild's ESM output. Legal comments are extracted to
 * dist/index.js.LEGAL.txt for MIT/BSD attribution without inflating the bundle.
 */

import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: 'dist/index.js',
  minify: true,
  drop: ['debugger'],
  external: ['@napi-rs/keyring', '@napi-rs/keyring-*'],
  legalComments: 'external',
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
  logLevel: 'info',
});
