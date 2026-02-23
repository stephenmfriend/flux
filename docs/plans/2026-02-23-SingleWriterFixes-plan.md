# Single-Writer Flux Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix zombie deletes, stale reads, and oversized `list_tasks` payloads by enforcing single-writer through the HTTP server and removing the broken merge-on-write strategy.

**Architecture:** All MCP and CLI writes route through the HTTP server via `FLUX_SERVER` env var. The SQLite adapter's `write()` becomes a direct serialise-and-write (no merge). The MCP `list_tasks` tool strips comments from responses and a new `get_task` tool returns full detail.

**Tech Stack:** TypeScript, Bun, SQLite (WAL mode), MCP SDK, Hono HTTP framework, Docker

---

### Task 1: Remove merge-on-write from SQLite adapter

**Files:**
- Modify: `packages/shared/src/adapters/sqlite-adapter.ts:57-84` (write method)
- Modify: `packages/shared/src/adapters/sqlite-adapter.ts:87-102` (remove mergeById)

**Step 1: Replace the `write()` method with direct write**

In `packages/shared/src/adapters/sqlite-adapter.ts`, replace lines 57-84:

```typescript
    write() {
      const serialized = JSON.stringify(_data);
      const row = selectStmt.get();
      if (row) {
        updateStmt.run(serialized);
      } else {
        insertStmt.run(serialized);
      }
    },
```

**Step 2: Remove the `mergeById` function**

Delete lines 87-102 (the `mergeById` function and its comment). It is no longer referenced.

**Step 3: Verify the build compiles**

Run: `cd /Users/stephenfriend/Development/personal/flux && bun run build`
Expected: Clean build, no errors.

**Step 4: Commit**

```bash
git add packages/shared/src/adapters/sqlite-adapter.ts
git commit -m "fix: remove merge-on-write from SQLite adapter

The mergeById strategy was a union operation that resurrected deleted
items. With single-writer through the HTTP server, the in-memory store
is authoritative and merging is unnecessary."
```

---

### Task 2: Update concurrency test to match new semantics

**Files:**
- Modify: `packages/shared/tests/sqlite-concurrency.test.ts:131-219`

The existing concurrency tests assume multi-writer with merge semantics. With single-writer, the tests need to reflect direct-write behaviour.

**Step 1: Update the mixed operations test**

In `packages/shared/tests/sqlite-concurrency.test.ts`, the third test (line 131) currently uses `toBeGreaterThanOrEqual(6)` because deletes were unreliable. Replace the assertion on line 212 with an exact count. With direct-write, the last writer wins — so if delete runs last, existing-2 is gone. The test should verify that the delete actually takes effect when it runs in isolation.

Replace lines 131-219 with a single-writer focused test:

```typescript
  test('single-writer: deletes persist without resurrection', () => {
    // Initialize with tasks
    const adapter = createSqliteAdapter(TEST_DB);
    adapter.read();
    adapter.data.projects = [{ id: 'test-project', name: 'Test' } as Project];
    adapter.data.tasks = [
      {
        id: 'task-to-delete',
        title: 'Delete Me',
        status: 'todo',
        depends_on: [],
        comments: [],
        project_id: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Task,
      {
        id: 'task-to-keep',
        title: 'Keep Me',
        status: 'todo',
        depends_on: [],
        comments: [],
        project_id: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Task,
    ];
    adapter.write();

    // Delete one task (single writer)
    adapter.data.tasks = adapter.data.tasks.filter(t => t.id !== 'task-to-delete');
    adapter.write();

    // Re-read from disk — deleted task should stay deleted
    const verifyAdapter = createSqliteAdapter(TEST_DB);
    verifyAdapter.read();

    expect(verifyAdapter.data.tasks.length).toBe(1);
    expect(verifyAdapter.data.tasks[0].id).toBe('task-to-keep');
  });
```

Keep the first two tests (concurrent writes and concurrent updates) as they still demonstrate valid behaviour — multiple adapter instances reading and writing in sequence.

**Step 2: Run the tests**

Run: `cd /Users/stephenfriend/Development/personal/flux && bun test packages/shared/tests/sqlite-concurrency.test.ts`
Expected: All tests pass.

**Step 3: Commit**

```bash
git add packages/shared/tests/sqlite-concurrency.test.ts
git commit -m "test: update concurrency tests for single-writer semantics

Replace multi-writer merge test with single-writer delete persistence
test. Verifies deletes are not resurrected on subsequent writes."
```

---

### Task 3: Strip comments from MCP `list_tasks` and `list_ready_tasks`

**Files:**
- Modify: `packages/mcp/src/index.ts:714-733` (list_tasks handler)
- Modify: `packages/mcp/src/index.ts:736-741` (list_ready_tasks handler)
- Modify: `packages/mcp/src/index.ts:196-213` (tasks resource handler)

**Step 1: Strip comments from `list_tasks` response**

In `packages/mcp/src/index.ts`, modify the `list_tasks` case (lines 714-733). After the `Promise.all` mapping, strip comments before returning:

```typescript
    case 'list_tasks': {
      const taskList = await getTasks(args?.project_id as string);
      let tasks = await Promise.all(
        taskList.map(async t => {
          const { comments, ...rest } = t;
          return {
            ...rest,
            comment_count: comments?.length ?? 0,
            blocked: await isTaskBlocked(t.id),
          };
        })
      );

      // Apply filters
      if (args?.epic_id) {
        tasks = tasks.filter(t => t.epic_id === args.epic_id);
      }
      if (args?.status) {
        tasks = tasks.filter(t => t.status === args.status);
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }],
      };
    }
```

**Step 2: Strip comments from `list_ready_tasks` response**

In the `list_ready_tasks` case (lines 736-741):

```typescript
    case 'list_ready_tasks': {
      const tasks = await getReadyTasks(args?.project_id as string | undefined);
      const slim = tasks.map(t => {
        const { comments, ...rest } = t;
        return { ...rest, comment_count: comments?.length ?? 0 };
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(slim, null, 2) }],
      };
    }
```

**Step 3: Strip comments from tasks resource**

In the `ReadResourceRequestSchema` handler, the tasks resource (lines 196-213):

```typescript
  const tasksMatch = uri.match(/^flux:\/\/projects\/([^/]+)\/tasks$/);
  if (tasksMatch) {
    const taskList = await getTasks(tasksMatch[1]);
    const tasks = await Promise.all(
      taskList.map(async t => {
        const { comments, ...rest } = t;
        return {
          ...rest,
          comment_count: comments?.length ?? 0,
          blocked: await isTaskBlocked(t.id),
        };
      })
    );
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(tasks, null, 2),
        },
      ],
    };
  }
```

**Step 4: Build and verify**

Run: `cd /Users/stephenfriend/Development/personal/flux && bun run build`
Expected: Clean build.

**Step 5: Commit**

```bash
git add packages/mcp/src/index.ts
git commit -m "fix: strip comments from list_tasks MCP response

Replace inline comments array with comment_count integer to reduce
payload size. Full comments available via get_task tool (next commit)."
```

---

### Task 4: Add `get_task` MCP tool

**Files:**
- Modify: `packages/mcp/src/index.ts` (add tool definition and handler)

**Step 1: Add tool definition**

In the `ListToolsRequestSchema` handler, add after the `list_ready_tasks` tool definition (after line 362):

```typescript
      {
        name: 'get_task',
        description: 'Get a single task with full details including comments',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'Task ID' },
          },
          required: ['task_id'],
        },
      },
```

**Step 2: Add handler**

In the `CallToolRequestSchema` handler, add after the `list_ready_tasks` case (after line 741):

```typescript
    case 'get_task': {
      const task = await getTask(args?.task_id as string);
      if (!task) {
        return { content: [{ type: 'text', text: 'Task not found' }], isError: true };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ...task, blocked: await isTaskBlocked(task.id) }, null, 2),
          },
        ],
      };
    }
```

**Step 3: Build and verify**

Run: `cd /Users/stephenfriend/Development/personal/flux && bun run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add packages/mcp/src/index.ts
git commit -m "feat: add get_task MCP tool for full task detail

Returns a single task with comments, acceptance criteria, guardrails,
and blocked status. Complements list_tasks which now strips comments."
```

---

### Task 5: Bake HOME env var into Dockerfile

**Files:**
- Modify: `Dockerfile:32`

**Step 1: Add HOME env var**

In the Dockerfile, after the existing ENV lines in the runner stage (after line 32), add:

```dockerfile
ENV HOME=/tmp/flux
```

This ensures blob storage's `mkdirSync` has a writable path without depending on the runtime `-e HOME=/tmp/flux` in the `flux-up` alias.

**Step 2: Commit**

```bash
git add Dockerfile
git commit -m "fix: set HOME=/tmp/flux in Dockerfile for blob storage

The blob storage module calls mkdirSync on HOME which the non-root
flux user cannot write to at /home/flux. Setting HOME=/tmp/flux in
the image removes the dependency on runtime env var workarounds."
```

---

### Task 6: Build and test Docker image

**Step 1: Build the Docker image**

Run: `cd /Users/stephenfriend/Development/personal/flux && docker build -t stephenmfriend/flux:latest .`
Expected: Successful build.

**Step 2: Test the image with a fresh container**

```bash
# Stop existing container
docker stop flux-web && docker rm flux-web

# Start with new image and FLUX_SERVER for MCP
docker run -d -p 3000:3000 \
  -v flux-data:/app/packages/data \
  -e FLUX_DATA=/app/packages/data/flux.sqlite \
  --name flux-web \
  stephenmfriend/flux:latest

# Verify web server is running
curl -s http://localhost:3000/health | jq .
```

Expected: `{"status":"ok"}`

**Step 3: Test MCP in server mode**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{},"clientInfo":{"name":"test","version":"1.0"},"protocolVersion":"2024-11-05"}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_projects","arguments":{}}}' \
  | docker exec -i -e FLUX_SERVER=http://localhost:3000 flux-web bun packages/mcp/dist/index.js
```

Expected: Successful response listing projects.

**Step 4: Test zombie delete fix**

```bash
# Create epic via MCP (through HTTP server)
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{},"clientInfo":{"name":"test","version":"1.0"},"protocolVersion":"2024-11-05"}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_epic","arguments":{"project_id":"PROJECT_ID","title":"TEST: Zombie check"}}}' \
  | docker exec -i -e FLUX_SERVER=http://localhost:3000 flux-web bun packages/mcp/dist/index.js

# Note the epic ID from the response, then delete via web API
curl -s -X DELETE http://localhost:3000/api/epics/EPIC_ID | jq .

# Verify epic is gone (should return 404)
curl -s http://localhost:3000/api/epics/EPIC_ID | jq .
```

Expected: Delete succeeds and epic stays deleted (no resurrection).

**Step 5: Test comment stripping**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{},"clientInfo":{"name":"test","version":"1.0"},"protocolVersion":"2024-11-05"}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_tasks","arguments":{"project_id":"PROJECT_ID"}}}' \
  | docker exec -i -e FLUX_SERVER=http://localhost:3000 flux-web bun packages/mcp/dist/index.js
```

Expected: Tasks in response have `comment_count` field but no `comments` array.

**Step 6: Commit (no code changes — verification only)**

No commit needed. This is a verification task.

---

### Task 7: Update MCP config and aliases

**Files:**
- Modify: `~/.claude.json` (mcpServers.flux)
- Modify: `~/.dotfiles/stow/zsh/dot-oh-my-zsh/custom/aliases.zsh` (flux-up alias)

**Step 1: Update MCP config**

In `~/.claude.json`, update the `flux` MCP server config to pass `FLUX_SERVER`:

```json
"flux": {
  "type": "stdio",
  "command": "docker",
  "args": [
    "exec", "-i",
    "-e", "FLUX_SERVER=http://localhost:3000",
    "flux-web",
    "bun", "packages/mcp/dist/index.js"
  ]
}
```

**Step 2: Update flux-up alias**

In `~/.dotfiles/stow/zsh/dot-oh-my-zsh/custom/aliases.zsh`, update the `flux-up` alias to use the new image and drop the `HOME` workaround (now baked into the image):

```bash
alias flux-up='docker run -d -p 3000:3000 -v flux-data:/app/packages/data -e FLUX_DATA=/app/packages/data/flux.sqlite --name flux-web stephenmfriend/flux:latest'
```

**Step 3: Commit dotfiles**

```bash
cd ~/.dotfiles
git add stow/zsh/dot-oh-my-zsh/custom/aliases.zsh
git commit -m "fix: update flux-up alias for custom image, drop HOME workaround"
```

Note: `~/.claude.json` is managed by Claude Code and typically not committed.

---

### Task 8: Push changes

**Step 1: Push flux fork**

```bash
cd /Users/stephenfriend/Development/personal/flux
git push origin main
```

**Step 2: Verify all changes are clean**

Run `git status` in both the flux repo and dotfiles to confirm no uncommitted changes.
