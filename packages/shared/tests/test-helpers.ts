import { vi } from 'vitest';
import type { Store, StorageAdapter } from '../src/types.js';
import { setStorageAdapter, initStore, resetStore } from '../src/store.js';

/**
 * Creates an isolated test storage adapter.
 *
 * IMPORTANT: Use this helper instead of creating adapters manually.
 * This ensures:
 * - Adapter is marked as test-only (isTest: true)
 * - Fresh isolated state for each test
 * - Cannot accidentally touch production database
 * - Safe for parallel test execution
 *
 * Usage in tests:
 * ```typescript
 * beforeEach(() => {
 *   setupTestStore();
 * });
 * ```
 */
export function createTestAdapter(initial?: Partial<Store>): StorageAdapter {
  const data: Store = {
    projects: [],
    epics: [],
    tasks: [],
    ...initial,
  };

  return {
    data,
    read: vi.fn(),
    write: vi.fn(),
    isTest: true, // CRITICAL: Marks this as test adapter, prevents resetStore() from running on production
  };
}

/**
 * Sets up an isolated test store for the current test.
 *
 * Call this in beforeEach() to ensure each test has a fresh, isolated database:
 * ```typescript
 * beforeEach(() => {
 *   setupTestStore();
 * });
 * ```
 *
 * This function:
 * 1. Creates a new isolated test adapter
 * 2. Sets it as the active storage adapter
 * 3. Initializes the store
 *
 * The adapter is completely isolated from:
 * - Other test files (vitest file-level isolation)
 * - Other tests in the same file (new adapter per beforeEach)
 * - Production database (isTest flag prevents accidental writes)
 */
export function setupTestStore(initial?: Partial<Store>): void {
  const adapter = createTestAdapter(initial);
  setStorageAdapter(adapter);
  initStore();
}

/**
 * Resets the current test store to empty state.
 *
 * Only works if the adapter is marked as a test adapter (isTest: true).
 * This is a safety mechanism to prevent accidentally wiping production data.
 *
 * Note: Usually you should use setupTestStore() in beforeEach() instead,
 * which creates a fresh adapter. Only use this if you specifically need to
 * clear state mid-test.
 */
export function resetTestStore(): void {
  resetStore();
}
