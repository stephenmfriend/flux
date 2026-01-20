import type { StorageAdapter } from '../store.js';
import type { StorageProviderConfig, StorageProviderType } from '../types.js';
import { createJsonAdapter } from './json-adapter.js';
import { createSqliteAdapter } from './sqlite-adapter.js';
import { createSupabaseAdapter } from './supabase-adapter.js';

export { createJsonAdapter } from './json-adapter.js';
export { createSqliteAdapter } from './sqlite-adapter.js';
export { createSupabaseAdapter } from './supabase-adapter.js';

/**
 * Create a storage adapter based on file extension (legacy).
 * - .sqlite or .db → SQLite adapter
 * - .json or anything else → JSON adapter
 *
 * @deprecated Use createAdapterFromConfig for provider-aware configuration
 */
export function createAdapter(filePath: string): StorageAdapter {
  if (filePath.endsWith('.sqlite') || filePath.endsWith('.db')) {
    return createSqliteAdapter(filePath);
  }
  return createJsonAdapter(filePath);
}

/**
 * Create a storage adapter from provider configuration.
 *
 * All providers implement the Universal Schema:
 * - Single entry (id = 'main' for cloud, id = 1 for SQLite)
 * - data field containing the full Store object
 * - updated_at timestamp (optional)
 *
 * Supported providers:
 * - sqlite: Local SQLite database
 * - json: Local JSON file
 * - supabase: Supabase (PostgreSQL with JSONB)
 *
 * @param config Provider configuration
 * @returns StorageAdapter instance
 */
export function createAdapterFromConfig(config: StorageProviderConfig): StorageAdapter {
  switch (config.provider) {
    case 'sqlite':
      return createSqliteAdapter(config.connectionString);

    case 'json':
      return createJsonAdapter(config.connectionString);

    case 'supabase': {
      // Extract URL and key from connection string or options
      const url = config.options?.url || extractSupabaseUrl(config.connectionString);
      const key = config.options?.key || process.env.SUPABASE_KEY || '';

      if (!url || !key) {
        throw new Error(
          'Supabase requires url and key. Provide via config.options or SUPABASE_KEY env var.'
        );
      }

      return createSupabaseAdapter(url, key, config.options);
    }

    default:
      throw new Error(`Unknown storage provider: ${(config as any).provider}`);
  }
}

/**
 * Extract Supabase URL from PostgreSQL connection string.
 *
 * Example:
 * postgresql://postgres:password@db.abc123xyz.supabase.co:5432/postgres
 * -> https://abc123xyz.supabase.co
 */
function extractSupabaseUrl(connectionString: string): string {
  // Match Supabase PostgreSQL connection strings
  const match = connectionString.match(/db\.([a-z0-9]+)\.supabase\.co/);
  if (match) {
    return `https://${match[1]}.supabase.co`;
  }

  // If already a URL, return as-is
  if (connectionString.startsWith('https://') && connectionString.includes('supabase.co')) {
    return connectionString;
  }

  return connectionString;
}

/**
 * Parse connection string or file path to determine provider type.
 *
 * Examples:
 * - data.sqlite → sqlite
 * - data.json → json
 * - postgresql://... → supabase
 * - https://xxx.supabase.co → supabase
 *
 * @param connectionString Connection string or file path
 * @returns Detected provider type
 */
export function detectProviderType(connectionString: string): StorageProviderType {
  // File extensions
  if (connectionString.endsWith('.sqlite') || connectionString.endsWith('.db')) {
    return 'sqlite';
  }
  if (connectionString.endsWith('.json')) {
    return 'json';
  }

  // Connection strings
  if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
    return 'supabase';
  }
  if (connectionString.includes('supabase.co')) {
    return 'supabase';
  }

  // Default to JSON for unknown file paths
  return 'json';
}
