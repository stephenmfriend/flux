# Universal Storage Schema

This document defines the **Universal Storage Schema** used by all Flux storage providers. This schema allows Flux to work with any storage backend (SQLite, Supabase, Firebase, Azure Cosmos DB, S3, etc.) without breaking changes.

---

## Core Principle

**All storage providers store exactly the same data structure:**

```typescript
{
  id: 'main',
  data: {
    projects: Project[],
    epics: Epic[],
    tasks: Task[]
  },
  updated_at?: string | number  // Optional timestamp
}
```

This simple pattern enables:
- ✅ **No breaking changes** - Same sync interface across all providers
- ✅ **Easy migration** - Export from one provider, import to another
- ✅ **Simple implementation** - New providers just need read/write of single record
- ✅ **Full compatibility** - All existing code continues to work

---

## TypeScript Definition

```typescript
export type UniversalStoreSchema = {
  id: 'main';              // Fixed identifier for single-entry storage
  data: Store;             // The full application state
  updated_at?: string | number;  // Optional timestamp
};

export type Store = {
  projects: Project[];
  epics: Epic[];
  tasks: Task[];
};
```

---

## Provider Implementations

### SQLite (Local Database)

**Schema:**
```sql
CREATE TABLE store (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);
```

**Read:**
```typescript
const row = db.prepare('SELECT data FROM store WHERE id = 1').get();
const store: Store = JSON.parse(row.data);
```

**Write:**
```typescript
const serialized = JSON.stringify(store);
db.prepare('UPDATE store SET data = ? WHERE id = 1').run(serialized);
```

---

### JSON (Local File)

**Schema:**
```json
{
  "projects": [...],
  "epics": [...],
  "tasks": [...]
}
```

**Read:**
```typescript
const content = fs.readFileSync('data.json', 'utf-8');
const store: Store = JSON.parse(content);
```

**Write:**
```typescript
fs.writeFileSync('data.json', JSON.stringify(store, null, 2));
```

---

### Supabase (PostgreSQL)

**Schema:**
```sql
CREATE TABLE flux_store (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Read:**
```typescript
const { data } = await supabase
  .from('flux_store')
  .select('data')
  .eq('id', 'main')
  .single();
const store: Store = data.data;
```

**Write:**
```typescript
await supabase
  .from('flux_store')
  .upsert({
    id: 'main',
    data: store,
    updated_at: new Date().toISOString()
  });
```

**Realtime Subscription:**
```typescript
supabase
  .channel('db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'flux_store' }, payload => {
    // Refresh in-memory data when remote changes detected
    adapter.read();
  })
  .subscribe();
```

---

### Firebase (Firestore)

**Schema:**
```typescript
// Collection: flux_stores
// Document ID: 'main'
{
  data: {
    projects: [...],
    epics: [...],
    tasks: [...]
  },
  updated_at: serverTimestamp()
}
```

**Read:**
```typescript
const doc = await firestore
  .collection('flux_stores')
  .doc('main')
  .get();
const store: Store = doc.data().data;
```

**Write:**
```typescript
await firestore
  .collection('flux_stores')
  .doc('main')
  .set({
    data: store,
    updated_at: FieldValue.serverTimestamp()
  });
```

**Realtime Listener:**
```typescript
firestore
  .collection('flux_stores')
  .doc('main')
  .onSnapshot(snapshot => {
    const store = snapshot.data().data;
    // Update in-memory cache
  });
```

---

### Azure Cosmos DB

**Schema:**
```typescript
// Container: flux_data
// Document:
{
  id: 'main',
  data: {
    projects: [...],
    epics: [...],
    tasks: [...]
  },
  _ts: 1234567890  // Cosmos auto-timestamp
}
```

**Read:**
```typescript
const { resource } = await container.item('main', 'main').read();
const store: Store = resource.data;
```

**Write:**
```typescript
await container.items.upsert({
  id: 'main',
  data: store
});
```

**Change Feed:**
```typescript
const iterator = container.items.changeFeed('main').getChangeFeedIterator();
while (iterator.hasMoreResults) {
  const response = await iterator.readNext();
  if (response.result) {
    // Process changes
  }
}
```

---

### AWS S3

**Schema:**
```typescript
// Bucket: flux-data
// Key: stores/main.json
{
  projects: [...],
  epics: [...],
  tasks: [...]
}
```

**Read:**
```typescript
const response = await s3.send(new GetObjectCommand({
  Bucket: 'flux-data',
  Key: 'stores/main.json'
}));
const body = await response.Body.transformToString();
const store: Store = JSON.parse(body);
```

**Write:**
```typescript
await s3.send(new PutObjectCommand({
  Bucket: 'flux-data',
  Key: 'stores/main.json',
  Body: JSON.stringify(store, null, 2),
  ContentType: 'application/json'
}));
```

**Versioning (Optional):**
```typescript
// Enable versioning on the bucket for audit trail
await s3.send(new PutBucketVersioningCommand({
  Bucket: 'flux-data',
  VersioningConfiguration: { Status: 'Enabled' }
}));
```

---

## Adapter Interface

All providers must implement this interface:

```typescript
export interface StorageAdapter {
  read(): void;        // Load Store into memory
  write(): void;       // Persist Store to storage
  data: Store;         // In-memory Store reference
  isTest?: boolean;    // Safety flag for test environments
}
```

**Implementation Pattern:**

```typescript
export function createProviderAdapter(connectionString: string): StorageAdapter {
  let _data: Store = { projects: [], epics: [], tasks: [] };

  return {
    read() {
      // Load from provider into _data
      _data = loadFromProvider(connectionString);
    },
    write() {
      // Save _data to provider
      saveToProvider(connectionString, _data);
    },
    get data() {
      return _data;
    },
    isTest: false
  };
}
```

---

## Configuration

### config.json (Future Support)

```json
{
  "storage": {
    "provider": "supabase",
    "connectionString": "postgresql://user:pass@host:5432/db",
    "options": {
      "table": "flux_store",
      "realtime": true
    }
  }
}
```

### Environment Variables

```bash
# Supabase
FLUX_STORAGE_PROVIDER=supabase
FLUX_STORAGE_CONNECTION=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-api-key

# Firebase
FLUX_STORAGE_PROVIDER=firebase
FLUX_STORAGE_CONNECTION=project-id
FIREBASE_PROJECT_ID=your-project

# Azure Cosmos
FLUX_STORAGE_PROVIDER=cosmos
FLUX_STORAGE_CONNECTION=AccountEndpoint=https://...

# S3
FLUX_STORAGE_PROVIDER=s3
FLUX_STORAGE_CONNECTION=s3://bucket/path
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## Migration Between Providers

Since all providers use the same schema, migration is simple:

```bash
# Export from current provider
flux export --output=backup.json

# Switch provider in config.json
# Edit: "provider": "supabase"

# Import to new provider
flux import --input=backup.json
```

**Programmatic Migration:**

```typescript
async function migrate(source: StorageAdapter, target: StorageAdapter) {
  // 1. Read from source
  source.read();
  const data = source.data;

  // 2. Write to target
  target.data = data;
  target.write();

  // 3. Verify
  target.read();
  if (!deepEqual(data, target.data)) {
    throw new Error('Migration verification failed');
  }
}
```

---

## Performance Considerations

### Current Approach (Universal Schema)
- ✅ **Simple:** Single read/write operation
- ✅ **Atomic:** All-or-nothing persistence
- ✅ **Compatible:** Works with all providers
- ❌ **Full-store writes:** Every mutation writes entire Store

### Future Optimization (Optional)
Providers can implement incremental updates while maintaining compatibility:

```typescript
interface OptimizedAdapter extends StorageAdapter {
  // Optional: Incremental operations (if provider supports)
  updateTask?(taskId: string, updates: Partial<Task>): void;
  deleteTask?(taskId: string): void;
}
```

This is **optional** - all providers can work perfectly with just `read()` and `write()`.

---

## Provider Comparison

| Provider | Schema | Realtime | Cost/Month | Best For |
|----------|--------|----------|------------|----------|
| SQLite | Single row | File watch | $0 | Local development |
| JSON | Single file | File watch | $0 | Git sync, human-readable |
| Supabase | Single JSONB row | WebSocket | $25-$100 | Production teams |
| Firebase | Single document | Built-in | $50-$200 | Mobile/offline apps |
| Cosmos | Single document | Change feed | $500+ | Enterprise global |
| S3 | Single object | SNS/polling | $5-$20 | Archival/backup |

---

## Implementation Checklist

To add a new storage provider:

- [ ] Implement `StorageAdapter` interface
- [ ] Follow Universal Schema (single entry with id='main')
- [ ] Serialize/deserialize entire Store object
- [ ] Add provider to `StorageProviderType` enum
- [ ] Update `createAdapterFromConfig()` switch statement
- [ ] Add connection string detection to `detectProviderType()`
- [ ] Write integration tests
- [ ] Document provider-specific setup (credentials, permissions)
- [ ] Add to provider comparison table

---

## Example: Adding a New Provider

```typescript
// packages/shared/src/adapters/my-provider-adapter.ts
import type { StorageAdapter } from '../store.js';
import type { Store } from '../types.js';

export function createMyProviderAdapter(connectionString: string): StorageAdapter {
  // Initialize provider client
  const client = initializeProvider(connectionString);

  let _data: Store = { projects: [], epics: [], tasks: [] };

  return {
    read() {
      // Load Store from provider
      const record = client.get('main');
      _data = record.data;
    },

    write() {
      // Save Store to provider
      client.upsert({
        id: 'main',
        data: _data,
        updated_at: Date.now()
      });
    },

    get data() {
      return _data;
    },

    isTest: false
  };
}
```

Then register in `adapters/index.ts`:

```typescript
case 'my-provider':
  return createMyProviderAdapter(config.connectionString);
```

---

## Summary

The Universal Schema ensures:
1. **No breaking changes** - Existing code works with all providers
2. **Simple implementation** - Just read/write single record
3. **Easy migration** - Same data structure everywhere
4. **Future-proof** - Can add providers without changing core architecture

All providers serialize the same `Store` object - the only differences are:
- How they store it (row, document, file, object)
- How they notify of changes (file watch, WebSocket, change feed, polling)
- Cost and performance characteristics
