import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { Store } from '../types.js';
import type { StorageAdapter } from '../store.js';

const defaultData: Store = {
  projects: [],
  epics: [],
  tasks: [],
};

/**
 * SQLite Storage Adapter
 *
 * Implements the Universal Schema pattern:
 * - Single row with id = 1
 * - data column containing JSON-serialized Store object
 *
 * Table schema:
 * ```sql
 * CREATE TABLE store (
 *   id INTEGER PRIMARY KEY CHECK (id = 1),
 *   data TEXT NOT NULL
 * );
 * ```
 *
 * This matches the universal pattern used by all providers:
 * - Supabase: Single row with id='main', data JSONB
 * - JSON: Single file with Store structure
 * - S3/Firebase/Cosmos: Single document/object with Store structure
 *
 * @param filePath Path to SQLite database file or ':memory:' for in-memory
 * @param isTest Mark as test adapter for safety checks
 */
export function createSqliteAdapter(filePath: string, isTest = false): StorageAdapter {
  const isMemory = filePath === ':memory:';

  // Only create directory for file-based databases
  if (!isMemory) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  // For in-memory databases, use proper SQLite URI
  const dbPath = isMemory ? ':memory:' : filePath;
  const db = new Database(dbPath, { create: true });

  // WAL mode for better concurrency (skip for in-memory databases)
  if (!isMemory) {
    db.exec('PRAGMA journal_mode = WAL');
  }
  db.exec('CREATE TABLE IF NOT EXISTS store (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)');

  const selectStmt = db.prepare('SELECT data FROM store WHERE id = 1');
  const insertStmt = db.prepare('INSERT INTO store (id, data) VALUES (1, ?)');
  const updateStmt = db.prepare('UPDATE store SET data = ? WHERE id = 1');

  let _data: Store = { ...defaultData };

  // Helper to read fresh data from DB
  const readFromDb = (): Store => {
    const row = selectStmt.get() as { data?: string } | null;
    if (row?.data) {
      try {
        return JSON.parse(row.data) as Store;
      } catch {
        return { ...defaultData };
      }
    }
    return { ...defaultData };
  };

  return {
    get data() {
      // Always return current in-memory state
      // Callers should call read() before accessing data
      return _data;
    },
    read() {
      // Always refresh from DB to get latest state
      _data = readFromDb();
      if (!selectStmt.get()) {
        // Initialize DB if empty
        insertStmt.run(JSON.stringify(_data));
      }
    },
    write() {
      try {
        // Begin immediate transaction for write lock
        // This prevents concurrent writes from interleaving
        db.exec('BEGIN IMMEDIATE');

        // Serialize current in-memory state
        const serialized = JSON.stringify(_data);
        const row = selectStmt.get();
        if (row) {
          updateStmt.run(serialized);
        } else {
          insertStmt.run(serialized);
        }

        // Commit transaction
        db.exec('COMMIT');
      } catch (error) {
        // Rollback on error
        try {
          db.exec('ROLLBACK');
        } catch {
          // Ignore rollback errors
        }
        throw error;
      }
    },
    isTest, // Mark test adapters for safety checks
  };
}
