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

export function createSqliteAdapter(filePath: string): StorageAdapter {
  // Ensure directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const db = new Database(filePath, { create: true });

  // WAL mode for better concurrency with multiple readers
  db.exec('PRAGMA journal_mode = WAL');
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
      return _data;
    },
    read() {
      // Always refresh from DB - critical for concurrent access
      _data = readFromDb();
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
    },
  };
}