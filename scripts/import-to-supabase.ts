#!/usr/bin/env bun
/**
 * Import data.json into Supabase
 * Usage: bun scripts/import-to-supabase.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { findFluxDir, loadEnvLocal, readConfig } from '../packages/shared/src/config.js';
import { createAdapterFromConfig } from '../packages/shared/src/adapters/index.js';
import type { Store } from '../packages/shared/src/types.js';

async function main() {
  // Load configuration
  const fluxDir = findFluxDir();
  loadEnvLocal(fluxDir);
  const config = readConfig(fluxDir);

  if (!config.storage) {
    console.error('Error: No storage configuration found in .flux/config.json');
    console.error('Make sure you have configured Supabase storage.');
    process.exit(1);
  }

  if (config.storage.provider !== 'supabase') {
    console.error('Error: Storage provider is not Supabase');
    console.error('This script only works with Supabase storage.');
    process.exit(1);
  }

  console.log('🔍 Loading old data.json...');
  const dataPath = resolve(fluxDir, 'data.json');
  let oldData: Store;

  try {
    const content = readFileSync(dataPath, 'utf-8');
    oldData = JSON.parse(content);
    console.log(`✓ Loaded data.json with:`);
    console.log(`  - ${oldData.projects.length} projects`);
    console.log(`  - ${oldData.epics.length} epics`);
    console.log(`  - ${oldData.tasks.length} tasks`);
  } catch (error) {
    console.error(`Error reading ${dataPath}:`, error);
    process.exit(1);
  }

  console.log('\n🚀 Connecting to Supabase...');
  const adapter = createAdapterFromConfig(config.storage);

  // The adapter's read() is fire-and-forget, we need to wait for initialization
  // Let's directly use the Supabase client
  const url = config.storage.options?.url || process.env.SUPABASE_URL || '';
  const key = config.storage.options?.key || process.env.SUPABASE_KEY || '';
  const tableName = config.storage.options?.table || 'flux_store';

  if (!url || !key) {
    console.error('Error: Missing Supabase credentials');
    process.exit(1);
  }

  try {
    // Dynamic import of Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(url, key);

    console.log('✓ Connected to Supabase\n');

    // Check if table exists and has data
    console.log('🔍 Checking existing data in Supabase...');
    const { data: existingData, error: readError } = await client
      .from(tableName)
      .select('data')
      .eq('id', 'main')
      .single();

    if (readError && readError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is OK
      console.error('Error reading from Supabase:', readError);
      process.exit(1);
    }

    if (existingData?.data) {
      const existing = existingData.data as Store;
      const hasData = existing.projects.length > 0 || existing.epics.length > 0 || existing.tasks.length > 0;

      if (hasData) {
        console.log(`⚠️  Supabase already contains data:`);
        console.log(`  - ${existing.projects.length} projects`);
        console.log(`  - ${existing.epics.length} epics`);
        console.log(`  - ${existing.tasks.length} tasks`);
        console.log('\n❌ Aborting to prevent data loss.');
        console.log('If you want to overwrite, manually delete the data first.\n');
        process.exit(1);
      } else {
        console.log('✓ Supabase table exists but is empty\n');
      }
    } else {
      console.log('✓ No existing data found\n');
    }

    // Import the data
    console.log('📝 Importing data to Supabase...');
    const { error: writeError } = await client
      .from(tableName)
      .upsert({
        id: 'main',
        data: oldData,
        updated_at: new Date().toISOString(),
      });

    if (writeError) {
      console.error('Error writing to Supabase:', writeError);
      process.exit(1);
    }

    console.log('✅ Import successful!\n');
    console.log('Imported:');
    console.log(`  - ${oldData.projects.length} projects`);
    console.log(`  - ${oldData.epics.length} epics`);
    console.log(`  - ${oldData.tasks.length} tasks`);
    console.log('\nYou can now use Flux with Supabase storage.');

  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

main();
