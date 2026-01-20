# Fail-Fast Development Setup

This document explains the fail-fast mechanisms implemented to catch bugs at **compile time** and **immediately on error**, not hours later in runtime.

## What Was Implemented

### 1. TypeScript Strict Mode + Watch

**Status**: ✅ Active

**Location**: `packages/web/tsconfig.app.json`

**Enabled Options**:
- `strict: true` - All strict type-checking options
- `noUncheckedIndexedAccess: true` - **Critical**: Catches `obj[key]` that might be undefined
- `exactOptionalPropertyTypes: true` - Prevents `undefined` where not allowed
- `noImplicitAny: true` - Catches missing type annotations

**Running**: TypeScript now runs in watch mode **alongside** the dev server:
```bash
bun run dev  # Runs vite + tsc --noEmit --watch concurrently
```

**What This Catches**:
```typescript
const config = TASK_TYPE_CONFIG[type];  // ERROR: config might be undefined
config.color;  // TypeScript error before you even save the file
```

### 2. ESLint Type-Aware Rules

**Status**: ✅ Configured

**Location**: `packages/web/eslint.config.js`

**Rules Enabled**:
- `@typescript-eslint/no-unnecessary-condition` - Catches checks that are always true/false
- `@typescript-eslint/no-unsafe-member-access` - **Critical**: Catches `obj.prop` on `any`/`unknown`
- `@typescript-eslint/no-unsafe-assignment` - Catches unsafe value assignments
- `@typescript-eslint/no-unsafe-call` - Catches calling `any` functions
- `@typescript-eslint/no-unsafe-return` - Catches returning `any` values
- `@typescript-eslint/no-unsafe-argument` - Catches passing `any` as arguments
- `@typescript-eslint/strict-boolean-expressions` - Prevents truthiness checks on non-booleans
- `@typescript-eslint/no-explicit-any` - Bans `any` type completely
- `@typescript-eslint/no-non-null-assertion` - Bans `!` assertions

**Running**:
```bash
bun run lint        # Check once
bun run lint:fix    # Auto-fix issues
```

**Editor Integration**: If you're using VSCode with ESLint extension, you'll see red squiggles immediately.

### 3. Zod Runtime Validation

**Status**: ✅ Implemented

**Location**: `packages/web/src/schemas.ts`

**What It Does**: Validates **all data** from external sources (API, localStorage, URL params) with runtime schemas.

**Example**:
```typescript
// Before (UNSAFE - type is just a lie):
const data = await fetch('/api/tasks').then(r => r.json());
const task: Task = data;  // ❌ TypeScript trusts this, but data might be malformed

// After (SAFE - validated at runtime):
import { parseTask } from './schemas';
const data = await fetch('/api/tasks').then(r => r.json());
const task = parseTask(data);  // ✅ Throws if data doesn't match schema
```

**Updated Files**:
- `packages/web/src/stores/api.ts` - All API functions now use Zod validation

**Schemas Created**:
- `TaskSchema` - Validates task data with `.type` default to `'task'`
- `EpicSchema` - Validates epic data
- `ProjectSchema` - Validates project data
- `StoreSchema` - Validates entire store structure

### 4. Global Error Handlers (Dev Only)

**Status**: ✅ Active in Development

**Location**: `packages/web/src/dev-error-handlers.ts`

**What It Does**: Catches **all** unhandled promise rejections and errors, displays them with full context.

**Features**:
- Red overlay appears on screen when an error occurs
- Full stack trace logged to console
- Timestamp for debugging
- Works for both `throw new Error()` and `Promise.reject()`

**Auto-loaded**: Imported in `main.tsx`, only runs in `DEV` mode.

### 5. Runtime Invariant Checks

**Status**: ✅ Available

**Package**: `tiny-invariant`

**Usage**:
```typescript
import invariant from 'tiny-invariant';

function renderTaskType(type: TaskType) {
  const config = TASK_TYPE_CONFIG[type];
  invariant(config, `Task type config missing for: ${type}`);
  // After this line, TypeScript knows config is defined
  return config.color;
}
```

**When to Use**:
- Component boundaries (props validation)
- After data transformations
- Before accessing potentially undefined values

## How It Prevents the Bug We Just Fixed

### The Bug
```typescript
const typeConfig = TASK_TYPE_CONFIG[taskType as TaskType];
// typeConfig might be undefined if import failed
return (
  <span style={{ color: typeConfig.color }}>  // ❌ Crash: Cannot read 'color' of undefined
    ...
  </span>
);
```

### How Fail-Fast Catches It

**Compile Time (TypeScript with `noUncheckedIndexedAccess`)**:
```typescript
const typeConfig = TASK_TYPE_CONFIG[taskType as TaskType];
// ERROR: typeConfig is possibly 'undefined'
typeConfig.color;  // ❌ TypeScript error before you even run the app
```

**Runtime (Zod Validation)**:
```typescript
const data = await fetch('/api/tasks').then(r => r.json());
const task = parseTask(data);  // ✅ Validates task.type exists and is valid
// If API returns invalid data, this throws immediately with clear error
```

**Runtime (Invariant)**:
```typescript
const typeConfig = TASK_TYPE_CONFIG[taskType];
invariant(typeConfig, `Missing config for type: ${taskType}`);
// ✅ Crashes immediately with clear message if config is missing
```

**Runtime (Global Error Handler)**:
- If error somehow slips through, dev overlay shows exactly what failed
- Console shows full stack trace + context

## Commands

```bash
# Development (type checking + dev server)
bun run dev

# Type checking only (watch mode)
bun run typecheck:watch

# Type checking (single run)
bun run typecheck

# Linting
bun run lint
bun run lint:fix

# Build (fails if type errors exist)
bun run build
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Type check
  run: bun run typecheck

- name: Lint
  run: bun run lint

- name: Build
  run: bun run build
```

All three must pass before deployment.

## What You Should Never See Again

❌ `Cannot read properties of undefined (reading 'color')`
❌ `Cannot read properties of undefined (reading 'label')`
❌ Runtime crashes from missing object properties
❌ Type errors discovered hours after writing code
❌ Silent data corruption from invalid API responses

## What You Will See Instead

✅ TypeScript error in editor immediately when typing
✅ Red squiggles from ESLint
✅ Build fails with clear error message
✅ Zod throws with "Expected string, received undefined at field X"
✅ Invariant throws with your custom error message
✅ Dev overlay shows exactly what went wrong

## Best Practices

1. **Never use `as any`** - ESLint will catch this
2. **Always validate external data** - Use Zod schemas for API responses, localStorage, URL params
3. **Use invariants at boundaries** - Component props, derived state, transformations
4. **Watch the TypeScript output** - It's running in the background, check terminal for errors
5. **Don't ignore ESLint warnings** - They prevent real bugs

## Future Enhancements

Consider adding:
- **Valibot** (lighter alternative to Zod)
- **io-ts** (if you need runtime type guards)
- **React Error Boundaries** (catch component render errors)
- **Sentry** (production error tracking)

## Files Modified

- `packages/web/tsconfig.app.json` - Added strict type checking options
- `packages/web/eslint.config.js` - **Created** with type-aware rules
- `packages/web/package.json` - Added ESLint, Zod, invariant, concurrently
- `packages/web/src/schemas.ts` - **Created** Zod validation schemas
- `packages/web/src/dev-error-handlers.ts` - **Created** global error handlers
- `packages/web/src/main.tsx` - Import dev error handlers
- `packages/web/src/stores/api.ts` - Added Zod validation to API calls
- `packages/web/src/components/DraggableTaskCard.tsx` - Added defensive checks
- `packages/web/src/components/TaskCard.tsx` - Added defensive checks

## Result

**Before**: Runtime crashes, debugging takes hours
**After**: Compile-time errors, immediate feedback in editor

The dev server is now running with TypeScript watch mode. **Refresh your browser** and the original error should be gone (or replaced with a clearer error message from our validation).
