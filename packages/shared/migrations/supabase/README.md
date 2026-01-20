# Supabase Migrations

This directory contains SQL migration scripts for setting up Flux with Supabase.

## Setup Instructions

1. **Create a Supabase project** at https://supabase.com

2. **Run the migration SQL:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `001_initial_schema.sql`
   - Click "Run"

3. **Get your credentials:**
   ```bash
   # In Supabase dashboard:
   # Settings > API > Project URL
   export SUPABASE_URL="https://xxx.supabase.co"

   # Settings > API > Project API keys > anon public
   export SUPABASE_KEY="eyJ..."
   ```

4. **Configure Flux:**

   Option A: Environment variables (recommended)
   ```bash
   # Add to .flux/.env.local
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_KEY=eyJ...
   ```

   Option B: config.json
   ```json
   {
     "storage": {
       "provider": "supabase",
       "connectionString": "postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres",
       "options": {
         "url": "$SUPABASE_URL",
         "key": "$SUPABASE_KEY",
         "realtime": true
       }
     }
   }
   ```

5. **Verify connection:**
   ```bash
   flux project list
   ```

## Schema Overview

The `flux_store` table uses the Universal Schema pattern:

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Always 'main' (single row) |
| data | JSONB | Complete Store object (projects, epics, tasks) |
| updated_at | TIMESTAMPTZ | Last modification timestamp |

This matches the pattern used by all Flux storage providers:
- **SQLite:** Single row with id=1, data TEXT (JSON string)
- **JSON:** Single file with Store structure
- **Supabase:** Single row with id='main', data JSONB

## Realtime Subscriptions

To enable live updates when multiple users modify data:

1. Uncomment this line in the migration:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE flux_store;
   ```

2. Set `realtime: true` in your config:
   ```json
   {
     "storage": {
       "provider": "supabase",
       "options": {
         "realtime": true
       }
     }
   }
   ```

## Row Level Security (RLS)

For multi-user setups, you can enable RLS to restrict access:

1. **Single-tenant (all users share same data):**
   ```sql
   ALTER TABLE flux_store ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Authenticated users can access flux_store"
     ON flux_store
     FOR ALL
     USING (auth.role() = 'authenticated');
   ```

2. **Multi-tenant (each user has their own data):**
   - Modify the schema to use user IDs instead of 'main'
   - Create per-user policies

## Troubleshooting

**Error: "relation flux_store does not exist"**
- Run the migration SQL in Supabase SQL Editor

**Error: "PGRST116" (no rows)**
- The table is empty, Flux will initialize it on first write

**Connection timeout:**
- Check your SUPABASE_URL and SUPABASE_KEY
- Verify network access to Supabase

**Realtime not working:**
- Ensure `ALTER PUBLICATION supabase_realtime ADD TABLE flux_store;` was run
- Check Supabase dashboard > Database > Replication

## Migration from SQLite/JSON

```bash
# 1. Export current data
flux export --output=backup.json

# 2. Update config to use Supabase
# Edit .flux/config.json

# 3. Import data
flux import --input=backup.json
```

## Advanced: Querying JSONB

Since data is stored as JSONB, you can query it efficiently:

```sql
-- Find all projects
SELECT jsonb_array_elements(data->'projects') as project
FROM flux_store;

-- Count tasks by status
SELECT
  task->>'status' as status,
  COUNT(*)
FROM flux_store,
  jsonb_array_elements(data->'tasks') as task
GROUP BY task->>'status';

-- Find high-priority tasks
SELECT
  task->>'id' as id,
  task->>'title' as title,
  task->'priority' as priority
FROM flux_store,
  jsonb_array_elements(data->'tasks') as task
WHERE (task->'priority')::int = 0;
```
