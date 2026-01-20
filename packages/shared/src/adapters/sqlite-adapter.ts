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
  let _dirty = false;  // Track if we have pending modifications

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
      // Only read fresh if we don't have pending modifications
      // This prevents losing in-flight changes while allowing fresh reads
      if (!_dirty) {
        _data = readFromDb();
      }
      _dirty = true;  // Mark as dirty once accessed (may be modified)
      return _data;
    },
    read() {
      // Explicit read - always refresh from DB (call at start of request)
      _data = readFromDb();
      _dirty = false;
      if (!selectStmt.get()) {
        // Initialize DB if empty
        insertStmt.run(JSON.stringify(_data));
      }
    },
    write() {
      const serialized = JSON.stringify(_data);
      const row = selectStmt.get();
      if (row) {
        updateStmt.run(serialized);
      } else {
        insertStmt.run(serialized);
      }
      _dirty = false;  // Clear dirty flag after write
    },
    isTest, // Mark test adapters for safety checks
  };
}
