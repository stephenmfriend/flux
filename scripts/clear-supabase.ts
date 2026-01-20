#!/usr/bin/env bun
/**
 * Clear all data from Supabase relational tables
 * Usage: bun scripts/clear-supabase.ts
 */

import { findFluxDir, loadEnvLocal, readConfig } from '../packages/shared/src/config.js';

async function main() {
  const fluxDir = findFluxDir();
  loadEnvLocal(fluxDir);
  const config = readConfig(fluxDir);

  if (!config.storage || config.storage.provider !== 'supabase') {
    console.error('Error: Supabase storage not configured');
    process.exit(1);
  }

  const url = config.storage.options?.url || process.env.SUPABASE_URL || '';
  const key = config.storage.options?.key || process.env.SUPABASE_KEY || '';

  if (!url || !key) {
    console.error('Error: Missing Supabase credentials');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(url, key);

  console.log('🗑️  Clearing all data from Supabase...\n');

  // Delete in reverse order (tasks, epics, projects) due to foreign keys
  const { error: tasksError } = await client.from('tasks').delete().neq('id', '');
  if (tasksError) console.error('Tasks delete error:', tasksError);
  else console.log('✓ Cleared tasks');

  const { error: epicsError } = await client.from('epics').delete().neq('id', '');
  if (epicsError) console.error('Epics delete error:', epicsError);
  else console.log('✓ Cleared epics');

  const { error: projectsError } = await client.from('projects').delete().neq('id', '');
  if (projectsError) console.error('Projects delete error:', projectsError);
  else console.log('✓ Cleared projects');

  console.log('\n✅ All data cleared\n');
}

main();
