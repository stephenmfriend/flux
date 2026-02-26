# Priority Badges and MCP Filter

Tasks currently encode priority in their title text (e.g. `WARN (P2): ...`). This is noisy and redundant once there's a visual indicator. The `priority` field already exists on `Task` but is never rendered in the web UI. The `list_tasks` MCP tool has no priority filter.

**Status:** Completed (2026-02-26)

---

## Context

Two gaps exist once priority is a first-class field on tasks:

1. **No visual indicator** — priority information is buried in title strings, making it invisible at a glance on the board
2. **No MCP filter** — agents cannot query by urgency, so they must fetch all tasks and filter client-side

Not in scope: `TaskForm` priority input, stripping existing `(P2)` from title strings (convention change only — future tasks won't need it).

---

## Approach

Use DaisyUI semantic badge classes for priority indicators — no inline styles needed:

| Priority | Label | DaisyUI class   | Colour |
|----------|-------|-----------------|--------|
| 0        | P0    | `badge-error`   | red    |
| 1        | P1    | `badge-warning` | orange |
| 2        | P2    | `badge-success` | green  |

Add a `priority` filter to `list_tasks` using the existing `PRIORITIES` constant already imported in `index.ts`.

---

## Checklist

- [x] **1:** Add priority badge to normal view (`DraggableTaskCard`)
- [x] **2:** Add priority badge to condensed view (`DraggableTaskCard`)
- [x] **3:** Add `priority` to `list_tasks` inputSchema
- [x] **4:** Add `priority` filter to `list_tasks` handler

---

## Execution

### Task 1 & 2: `packages/web/src/components/DraggableTaskCard.tsx`

Add `PRIORITY_BADGE` map above the component:

```tsx
const PRIORITY_BADGE: Record<number, string> = {
  0: 'badge-error',
  1: 'badge-warning',
  2: 'badge-success',
}
```

**Normal view** — in the epic label row, add priority badge before blocked badge. `ml-auto` goes on the first right-edge item:

```tsx
{task.priority !== undefined && (
  <span class={`badge badge-xs ml-auto ${PRIORITY_BADGE[task.priority]}`}>
    P{task.priority}
  </span>
)}
{task.blocked && (
  <span class={`badge badge-xs badge-warning ${task.priority === undefined ? 'ml-auto' : ''}`}>
    Blocked
  </span>
)}
```

**Condensed view** — add badge after the epic colour dot, before the title:

```tsx
{task.priority !== undefined && (
  <span class={`badge badge-xs flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}>
    P{task.priority}
  </span>
)}
```

### Tasks 3 & 4: `packages/mcp/src/index.ts`

**`list_tasks` inputSchema** — add priority property:

```ts
priority: {
  type: 'integer',
  enum: PRIORITIES,
  description: 'Optional: filter by priority (0=urgent, 1=normal, 2=low)',
},
```

**`list_tasks` handler** — add filter after the status filter:

```ts
if (args?.priority !== undefined) {
  tasks = tasks.filter(t => t.priority === args.priority);
}
```

---

## Verification

1. Start the web UI dev server — task cards show P0/P1/P2 badges in top-right of card
2. Cards with no priority set show no badge
3. Cards with both blocked + priority show both badges right-aligned
4. Condensed view cards show the badge inline before the title
5. MCP: `list_tasks` with `priority: 0` returns only P0 tasks; `priority: 2` returns only P2 tasks
6. Both packages build clean: `cd packages/mcp && npm run build` and `cd packages/web && npm run build`
