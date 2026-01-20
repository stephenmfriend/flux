# Storage Provider Implementation Guide

This guide shows how to implement storage providers for Flux using the Universal Schema pattern.

---

## Quick Start

1. **Create adapter file:** `packages/shared/src/adapters/your-provider-adapter.ts`
2. **Implement `StorageAdapter` interface**
3. **Follow Universal Schema** (single entry with id='main', data field)
4. **Register in `adapters/index.ts`**
5. **Add to provider detection logic**
6. **Write tests**

---

## Provider: Supabase (PostgreSQL)

### Installation

```bash
bun add @supabase/supabase-js
```

### Schema Setup

```sql
-- Run this in Supabase SQL Editor
CREATE TABLE flux_store (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE flux_store;

-- Row-level security (optional, for multi-tenant)
ALTER TABLE flux_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their store"
  ON flux_store
  FOR ALL
  USING (auth.uid()::text = 'main');  -- Adjust for your auth logic
```

### Adapter Implementation

```typescript
// packages/shared/src/adapters/supabase-adapter.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { StorageAdapter } from '../store.js';
import type { Store } from '../types.js';

const defaultData: Store = {
  projects: [],
  epics: [],
  tasks: [],
};

export function createSupabaseAdapter(
  url: string,
  key: string,
  options?: { table?: string; realtime?: boolean }
): StorageAdapter {
  const tableName = options?.table || 'flux_store';
  const client = createClient(url, key);

  let _data: Store = { ...defaultData };
  let _dirty = false;

  // Realtime subscription (optional)
  if (options?.realtime) {
    client
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          // Refresh data when remote changes detected
          if (!_dirty) {
            readFromDb().then(data => { _data = data; });
          }
        }
      )
      .subscribe();
  }

  const readFromDb = async (): Promise<Store> => {
    const { data, error } = await client
      .from(tableName)
      .select('data')
      .eq('id', 'main')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - initialize
        return { ...defaultData };
      }
      throw error;
    }

    return data.data as Store;
  };

  const writeToDb = async (store: Store): Promise<void> => {
    const { error } = await client
      .from(tableName)
      .upsert({
        id: 'main',
        data: store,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  };

  return {
    read() {
      // Synchronous wrapper - load happens on first access
      readFromDb().then(data => {
        _data = data;
        _dirty = false;
      });
    },

    write() {
      // Fire-and-forget write (can make async with queue)
      writeToDb(_data);
      _dirty = false;
    },

    get data() {
      if (!_dirty) {
        // Lazy load on first access
        readFromDb().then(data => { _data = data; });
      }
      _dirty = true;
      return _data;
    },

    isTest: false,
  };
}
```

### Registration

```typescript
// packages/shared/src/adapters/index.ts
import { createSupabaseAdapter } from './supabase-adapter.js';

export function createAdapterFromConfig(config: StorageProviderConfig): StorageAdapter {
  switch (config.provider) {
    case 'supabase': {
      const url = config.options?.url || extractSupabaseUrl(config.connectionString);
      const key = config.options?.key || process.env.SUPABASE_KEY;
      if (!url || !key) {
        throw new Error('Supabase requires url and key');
      }
      return createSupabaseAdapter(url, key, config.options);
    }
    // ... other cases
  }
}

function extractSupabaseUrl(connectionString: string): string {
  // postgresql://postgres:password@db.abc123.supabase.co:5432/postgres
  // -> https://abc123.supabase.co
  const match = connectionString.match(/db\.([^.]+)\.supabase\.co/);
  if (match) {
    return `https://${match[1]}.supabase.co`;
  }
  return connectionString;
}
```

### Environment Variables

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
```

### Configuration

```json
{
  "storage": {
    "provider": "supabase",
    "connectionString": "postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres",
    "options": {
      "url": "https://xxx.supabase.co",
      "key": "$SUPABASE_KEY",
      "table": "flux_store",
      "realtime": true
    }
  }
}
```

---

## Provider: Firebase (Firestore)

### Installation

```bash
bun add firebase-admin
```

### Schema Setup

No schema required - Firestore is schemaless.

**Collection:** `flux_stores`
**Document ID:** `main`

### Adapter Implementation

```typescript
// packages/shared/src/adapters/firebase-adapter.ts
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import type { StorageAdapter } from '../store.js';
import type { Store } from '../types.js';

const defaultData: Store = {
  projects: [],
  epics: [],
  tasks: [],
};

export function createFirebaseAdapter(
  projectId: string,
  credentials?: ServiceAccount,
  options?: { collection?: string; realtime?: boolean }
): StorageAdapter {
  const collectionName = options?.collection || 'flux_stores';

  // Initialize Firebase
  const app = initializeApp({
    credential: credentials ? cert(credentials) : undefined,
    projectId,
  });

  const db = getFirestore(app);
  const docRef = db.collection(collectionName).doc('main');

  let _data: Store = { ...defaultData };
  let _dirty = false;

  // Realtime listener (optional)
  if (options?.realtime) {
    docRef.onSnapshot(snapshot => {
      if (snapshot.exists && !_dirty) {
        _data = snapshot.data()?.data || defaultData;
      }
    });
  }

  const readFromDb = async (): Promise<Store> => {
    const doc = await docRef.get();
    if (!doc.exists) {
      return { ...defaultData };
    }
    return doc.data()?.data || defaultData;
  };

  const writeToDb = async (store: Store): Promise<void> => {
    await docRef.set({
      data: store,
      updated_at: FieldValue.serverTimestamp(),
    });
  };

  return {
    read() {
      readFromDb().then(data => {
        _data = data;
        _dirty = false;
      });
    },

    write() {
      writeToDb(_data);
      _dirty = false;
    },

    get data() {
      if (!_dirty) {
        readFromDb().then(data => { _data = data; });
      }
      _dirty = true;
      return _data;
    },

    isTest: false,
  };
}
```

### Environment Variables

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS=/path/to/service-account.json
```

### Configuration

```json
{
  "storage": {
    "provider": "firebase",
    "connectionString": "your-project-id",
    "options": {
      "credentials": "$FIREBASE_CREDENTIALS",
      "collection": "flux_stores",
      "realtime": true
    }
  }
}
```

---

## Provider: Azure Cosmos DB

### Installation

```bash
bun add @azure/cosmos
```

### Schema Setup

**Container:** `flux_data`
**Partition Key:** `/id`
**Document:**
```json
{
  "id": "main",
  "data": { "projects": [], "epics": [], "tasks": [] }
}
```

### Adapter Implementation

```typescript
// packages/shared/src/adapters/cosmos-adapter.ts
import { CosmosClient, type Container } from '@azure/cosmos';
import type { StorageAdapter } from '../store.js';
import type { Store } from '../types.js';

const defaultData: Store = {
  projects: [],
  epics: [],
  tasks: [],
};

export function createCosmosAdapter(
  endpoint: string,
  key: string,
  options?: { database?: string; container?: string }
): StorageAdapter {
  const databaseId = options?.database || 'flux';
  const containerId = options?.container || 'flux_data';

  const client = new CosmosClient({ endpoint, key });
  const container = client.database(databaseId).container(containerId);

  let _data: Store = { ...defaultData };
  let _dirty = false;

  const readFromDb = async (): Promise<Store> => {
    try {
      const { resource } = await container.item('main', 'main').read();
      return resource?.data || defaultData;
    } catch (error: any) {
      if (error.code === 404) {
        return { ...defaultData };
      }
      throw error;
    }
  };

  const writeToDb = async (store: Store): Promise<void> => {
    await container.items.upsert({
      id: 'main',
      data: store,
    });
  };

  return {
    read() {
      readFromDb().then(data => {
        _data = data;
        _dirty = false;
      });
    },

    write() {
      writeToDb(_data);
      _dirty = false;
    },

    get data() {
      if (!_dirty) {
        readFromDb().then(data => { _data = data; });
      }
      _dirty = true;
      return _data;
    },

    isTest: false,
  };
}
```

### Environment Variables

```bash
COSMOS_ENDPOINT=https://xxx.documents.azure.com:443/
COSMOS_KEY=your-primary-key
```

### Configuration

```json
{
  "storage": {
    "provider": "cosmos",
    "connectionString": "AccountEndpoint=https://xxx.documents.azure.com:443/;AccountKey=xxx",
    "options": {
      "database": "flux",
      "container": "flux_data"
    }
  }
}
```

---

## Provider: AWS S3

### Installation

```bash
bun add @aws-sdk/client-s3
```

### Schema Setup

**Bucket:** `flux-data` (create in AWS Console)
**Key:** `stores/main.json`
**Versioning:** Enabled (optional, for audit trail)

### Adapter Implementation

```typescript
// packages/shared/src/adapters/s3-adapter.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { StorageAdapter } from '../store.js';
import type { Store } from '../types.js';

const defaultData: Store = {
  projects: [],
  epics: [],
  tasks: [],
};

export function createS3Adapter(
  bucketName: string,
  options?: { region?: string; key?: string }
): StorageAdapter {
  const region = options?.region || 'us-east-1';
  const key = options?.key || 'stores/main.json';

  const client = new S3Client({ region });

  let _data: Store = { ...defaultData };
  let _dirty = false;

  const readFromS3 = async (): Promise<Store> => {
    try {
      const response = await client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }));
      const body = await response.Body?.transformToString();
      return body ? JSON.parse(body) : defaultData;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return { ...defaultData };
      }
      throw error;
    }
  };

  const writeToS3 = async (store: Store): Promise<void> => {
    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(store, null, 2),
      ContentType: 'application/json',
    }));
  };

  return {
    read() {
      readFromS3().then(data => {
        _data = data;
        _dirty = false;
      });
    },

    write() {
      writeToS3(_data);
      _dirty = false;
    },

    get data() {
      if (!_dirty) {
        readFromS3().then(data => { _data = data; });
      }
      _dirty = true;
      return _data;
    },

    isTest: false,
  };
}
```

### Environment Variables

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=flux-data
```

### Configuration

```json
{
  "storage": {
    "provider": "s3",
    "connectionString": "s3://flux-data/stores/main.json",
    "options": {
      "region": "us-east-1"
    }
  }
}
```

---

## Testing Your Adapter

### Unit Test Template

```typescript
// packages/shared/tests/my-provider-adapter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMyProviderAdapter } from '../src/adapters/my-provider-adapter.js';
import { setStorageAdapter, initStore, createProject } from '../src/store.js';

describe('MyProvider Adapter', () => {
  beforeEach(() => {
    const adapter = createMyProviderAdapter('test-connection-string');
    setStorageAdapter(adapter);
    initStore();
  });

  it('should read and write data', () => {
    const project = createProject('Test Project');
    const adapter = getStorageAdapter();

    // Verify in-memory
    expect(adapter.data.projects).toHaveLength(1);
    expect(adapter.data.projects[0].name).toBe('Test Project');

    // Simulate persistence
    adapter.write();
    adapter.read();

    // Verify persisted data
    expect(adapter.data.projects).toHaveLength(1);
  });

  it('should follow universal schema', () => {
    const adapter = getStorageAdapter();
    expect(adapter.data).toHaveProperty('projects');
    expect(adapter.data).toHaveProperty('epics');
    expect(adapter.data).toHaveProperty('tasks');
  });
});
```

### Integration Test (with real provider)

```typescript
describe('Supabase Adapter (Integration)', () => {
  const url = process.env.SUPABASE_TEST_URL!;
  const key = process.env.SUPABASE_TEST_KEY!;

  beforeEach(async () => {
    // Clean up test data
    const client = createClient(url, key);
    await client.from('flux_store').delete().eq('id', 'main');
  });

  it('should persist data to Supabase', async () => {
    const adapter = createSupabaseAdapter(url, key);
    setStorageAdapter(adapter);
    initStore();

    const project = createProject('Integration Test');
    adapter.write();

    // Wait for async write
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Read from different adapter instance
    const adapter2 = createSupabaseAdapter(url, key);
    adapter2.read();
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(adapter2.data.projects).toHaveLength(1);
    expect(adapter2.data.projects[0].name).toBe('Integration Test');
  });
});
```

---

## Common Patterns

### Async Initialization (Recommended)

```typescript
export function createProviderAdapter(connectionString: string): StorageAdapter {
  let _data: Store = { ...defaultData };
  let _initialized = false;

  const initialize = async () => {
    if (_initialized) return;
    _data = await loadFromProvider(connectionString);
    _initialized = true;
  };

  return {
    read() {
      // Trigger initialization on first read
      initialize();
    },

    write() {
      // Queue write (don't block)
      saveToProvider(connectionString, _data);
    },

    get data() {
      // Lazy load if not initialized
      if (!_initialized) {
        initialize();
      }
      return _data;
    },

    isTest: false,
  };
}
```

### Error Handling

```typescript
read() {
  readFromDb()
    .then(data => { _data = data; })
    .catch(error => {
      console.error('[Adapter] Read failed:', error);
      // Fallback to default data
      _data = { ...defaultData };
    });
}

write() {
  writeToDb(_data).catch(error => {
    console.error('[Adapter] Write failed:', error);
    // Queue for retry or log for manual intervention
  });
}
```

### Caching with TTL

```typescript
let _data: Store = { ...defaultData };
let _lastRead = 0;
const CACHE_TTL = 5000; // 5 seconds

get data() {
  const now = Date.now();
  if (now - _lastRead > CACHE_TTL) {
    readFromDb().then(data => {
      _data = data;
      _lastRead = now;
    });
  }
  return _data;
}
```

---

## Checklist

- [ ] Adapter follows Universal Schema (id='main', data field)
- [ ] Implements `StorageAdapter` interface (read, write, data, isTest)
- [ ] Handles missing data (returns defaultData)
- [ ] Handles errors gracefully
- [ ] Registered in `createAdapterFromConfig()`
- [ ] Added to `detectProviderType()`
- [ ] Unit tests written
- [ ] Integration tests with real provider (optional)
- [ ] Documentation updated (provider comparison table)
- [ ] Example configuration in UNIVERSAL_SCHEMA.md
- [ ] Environment variables documented

---

## Next Steps

1. Choose a provider to implement
2. Copy the template from this guide
3. Adapt for your provider's client library
4. Test with real credentials
5. Submit PR with tests and documentation

For questions, see `UNIVERSAL_SCHEMA.md` or open an issue.
