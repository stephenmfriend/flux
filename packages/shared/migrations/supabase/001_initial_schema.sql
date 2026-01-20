-- Flux Storage Schema for Supabase
-- Universal Schema: Single row with id='main' containing all data

-- Create flux_store table
CREATE TABLE IF NOT EXISTS flux_store (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on updated_at for change tracking
CREATE INDEX IF NOT EXISTS idx_flux_store_updated_at ON flux_store(updated_at);

-- Enable Row Level Security (optional - for multi-tenant setups)
-- Uncomment if you want to restrict access per user
-- ALTER TABLE flux_store ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to access their store
-- Uncomment and modify for multi-tenant setups
-- CREATE POLICY "Users can access their own store"
--   ON flux_store
--   FOR ALL
--   USING (auth.uid()::text = id);

-- For single-tenant (most common), allow all authenticated users
-- Uncomment this instead:
-- CREATE POLICY "Authenticated users can access flux_store"
--   ON flux_store
--   FOR ALL
--   USING (auth.role() = 'authenticated');

-- Insert default data if table is empty
INSERT INTO flux_store (id, data, updated_at)
VALUES (
  'main',
  '{"projects": [], "epics": [], "tasks": []}'::jsonb,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for this table (optional)
-- Uncomment to allow clients to subscribe to changes
-- ALTER PUBLICATION supabase_realtime ADD TABLE flux_store;

-- Helpful queries for debugging:
-- SELECT id, jsonb_array_length(data->'projects') as project_count,
--        jsonb_array_length(data->'epics') as epic_count,
--        jsonb_array_length(data->'tasks') as task_count,
--        updated_at
-- FROM flux_store;
