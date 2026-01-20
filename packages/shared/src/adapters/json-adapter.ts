import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { Store } from '../types.js';
import type { StorageAdapter } from '../store.js';

const defaultData: Store = {
  projects: [],
  epics: [],
  tasks: [],
};

/**
 * JSON File Storage Adapter
 *
 * Implements the Universal Schema pattern:
 * - Single JSON file containing the Store object
 * - Direct serialization/deserialization with no wrapper
 *
 * File structure:
 * ```json
 * {
 *   "projects": [...],
 *   "epics": [...],
 *   "tasks": [...]
 * }
 * ```
 *
 * This matches the universal pattern used by all providers:
 * - Supabase: Single row with id='main', data JSONB (same structure)
 * - SQLite: Single row with id=1, data TEXT (JSON string of same structure)
 * - S3/Firebase/Cosmos: Single document/object with same structure
 *
 * Benefits:
 * - Human-readable and editable
 * - Git-friendly (easy diffs)
 * - Simple backup (just copy file)
 *
 * @param filePath Path to JSON file
 */
export function createJsonAdapter(filePath: string): StorageAdapter {
  let data: Store = { ...defaultData };

  return {
    get data() {
      return data;
    },
    read() {
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          data = JSON.parse(content) as Store;
        } catch {
          data = { ...defaultData };
        }
      } else {
        data = { ...defaultData };
        this.write();
      }
    },
    write() {
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(filePath, JSON.stringify(data, null, 2));
    },
  };
}
