import { describe, it, expect, vi } from 'vitest';
import { setStorageAdapter } from '../src/store.js';
import type { Store } from '../src/types.js';

describe('NODE_ENV protection', () => {
  it('blocks production adapter when NODE_ENV=test', () => {
    // Create a production-like adapter (isTest not set)
    const productionAdapter = {
      data: { projects: [], epics: [], tasks: [] } as Store,
      read: vi.fn(),
      write: vi.fn(),
      // isTest: false or undefined - this is a production adapter
    };

    // This should throw because NODE_ENV=test but adapter.isTest is not true
    expect(() => {
      setStorageAdapter(productionAdapter);
    }).toThrow(/Cannot use production storage adapter in test environment/);
  });

  it('allows test adapter when NODE_ENV=test', () => {
    // Create a test adapter (isTest = true)
    const testAdapter = {
      data: { projects: [], epics: [], tasks: [] } as Store,
      read: vi.fn(),
      write: vi.fn(),
      isTest: true, // Marked as test adapter
    };

    // This should NOT throw
    expect(() => {
      setStorageAdapter(testAdapter);
    }).not.toThrow();
  });

  it('error message explains how to fix the issue', () => {
    const productionAdapter = {
      data: { projects: [], epics: [], tasks: [] } as Store,
      read: vi.fn(),
      write: vi.fn(),
    };

    // Should throw with helpful error message
    try {
      setStorageAdapter(productionAdapter);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('NODE_ENV=test');
      expect(message).toContain('adapter.isTest');
      expect(message).toContain('createTestAdapter()');
      expect(message).toContain('production data corruption');
    }
  });
});
