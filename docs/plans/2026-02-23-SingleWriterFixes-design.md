# Single-Writer Flux Fixes

**Date**: 2026-02-23
**Status**: Approved

## Problem

Three bugs when multiple processes share the SQLite database:

1. **Zombie deletes** — `mergeById` in the SQLite adapter is a union operation
   that resurrects deleted items when any other process writes.
2. **Stale reads** — the web server's `watchFile` polling is unreliable with
   WAL-mode SQLite, so the Kanban UI can lag behind MCP changes.
3. **Oversized `list_tasks`** — full task objects with all comments returned
   with no pagination, exceeding Claude's context limits on large projects.

## Architecture

Single-writer principle: all mutations flow through the HTTP server. The
server's in-memory store is the single source of truth.

```
Claude Session 1 ──┐
Claude Session 2 ──┤── MCP (FLUX_SERVER) ──► HTTP Server ──► SQLite
Claude Session 3 ──┘                              ▲
Web Kanban UI ────────────────────────────────────┘
CLI (occasional) ── FLUX_SERVER ──────────────────┘
```

No process touches SQLite directly except the server.

## Changes

### 1. Remove merge-on-write from SQLite adapter

**File**: `packages/shared/src/adapters/sqlite-adapter.ts`

Replace the transactional merge in `write()` with a direct write. Remove the
`mergeById` helper entirely.

The merge existed to handle multi-writer concurrency but it cannot handle
deletes — a union operation only adds, never removes. With single-writer
through the HTTP server, the merge is unnecessary.

### 2. Strip comments from `list_tasks`

**Files**: `packages/mcp/src/index.ts`, `packages/server/src/index.ts`

Remove `comments` from task objects in list responses. Comments are only
useful when examining a specific task, not when listing all tasks.

### 3. Add `get_task` MCP tool

**File**: `packages/mcp/src/index.ts`

Expose a `get_task` tool that returns a single task with full details
including comments. The underlying `getTask(id)` client function already
exists but is not exposed as an MCP tool.

### 4. MCP config: route through HTTP server

**File**: `~/.claude.json`

Add `-e FLUX_SERVER=http://localhost:3000` to the `docker exec` args so the
MCP process uses the HTTP client path instead of direct SQLite access.

### 5. Dockerfile: bake HOME env var

**File**: `Dockerfile`

Add `ENV HOME=/tmp/flux` in the runner stage so blob storage has a writable
path without depending on runtime `-e HOME=/tmp/flux` in the alias.

## What we are NOT changing

- **`watchFile` mechanism** — already exists, works well enough with
  single-writer.
- **JSON adapter** — only used in dev/non-Docker scenarios.
- **Auth** — not touching API keys or auth flow.

## Testing

1. Create epic via MCP, delete via web API, verify it stays deleted.
2. Two MCP processes creating/deleting tasks, verify consistency.
3. Verify `list_tasks` response size is reasonable (no comments).
4. Verify `get_task` returns full detail with comments.

## Risk

If someone runs MCP in local mode (without `FLUX_SERVER`), writes bypass
the server and hit SQLite directly. Without the merge, these writes
overwrite rather than union. This is acceptable — the merge was broken
anyway (zombie deletes), and overwrite is safer than silent resurrection.
