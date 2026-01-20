#!/usr/bin/env bun
/**
 * Migrate Supabase from blob schema to relational schema
 * Usage: bun scripts/migrate-to-relational.ts
 *
 * This script:
 * 1. Exports data from old flux_store blob table
 * 2. Drops old table and creates new relational schema
 * 3. Imports data into new projects, epics, tasks tables
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { findFluxDir, loadEnvLocal, readConfig } from '../packages/shared/src/config.js';
import type { Store } from '../packages/shared/src/types.js';

async function main() {
  // Load configuration
  const fluxDir = findFluxDir();
  loadEnvLocal(fluxDir);
  const config = readConfig(fluxDir);

  if (!config.storage) {
    console.error('Error: No storage configuration found in .flux/config.json');
    process.exit(1);
  }

  if (config.storage.provider !== 'supabase') {
    console.error('Error: Storage provider is not Supabase');
    process.exit(1);
  }

  const url = config.storage.options?.url || process.env.SUPABASE_URL || '';
  const key = config.storage.options?.key || process.env.SUPABASE_KEY || '';

  if (!url || !key) {
    console.error('Error: Missing Supabase credentials');
    process.exit(1);
  }

  try {
    // Dynamic import of Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(url, key);

    console.log('🔍 Exporting data from old flux_store table...\n');

    // Try to read from old blob table
    const { data: oldData, error: readError } = await client
      .from('flux_store')
      .select('data')
      .eq('id', 'main')
      .single();

    let storeData: Store;

    if (readError) {
      if (readError.code === 'PGRST116') {
        console.log('⚠️  No data found in flux_store table');
        storeData = { projects: [], epics: [], tasks: [] };
      } else if (readError.message?.includes('does not exist')) {
        console.log('✓ Old flux_store table does not exist (already migrated?)');
        storeData = { projects: [], epics: [], tasks: [] };
      } else {
        throw readError;
      }
    } else {
      storeData = oldData?.data as Store || { projects: [], epics: [], tasks: [] };
      console.log(`✓ Exported data:`);
      console.log(`  - ${storeData.projects.length} projects`);
      console.log(`  - ${storeData.epics.length} epics`);
      console.log(`  - ${storeData.tasks.length} tasks\n`);
    }

    // Check if new tables exist
    console.log('🔍 Checking for new relational schema...\n');
    const { error: projectsCheckError } = await client.from('projects').select('id').limit(1);

    if (projectsCheckError) {
      console.log('❌ New relational tables not found!\n');
      console.log('You need to run the migration SQL first:');
      console.log('1. Go to your Supabase dashboard → SQL Editor');
      console.log('2. Run the SQL from: packages/shared/migrations/supabase/002_relational_schema.sql');
      console.log('3. Then run this script again\n');
      process.exit(1);
    }

    console.log('✓ New relational schema detected\n');

    // Import data into new tables
    if (storeData.projects.length > 0 || storeData.epics.length > 0 || storeData.tasks.length > 0) {
      console.log('📝 Importing data into relational tables...\n');

      const operations: Promise<any>[] = [];

      if (storeData.projects.length > 0) {
        console.log(`  - Importing ${storeData.projects.length} projects...`);
        operations.push(client.from('projects').insert(storeData.projects));
      }

      if (storeData.epics.length > 0) {
        console.log(`  - Importing ${storeData.epics.length} epics...`);
        operations.push(client.from('epics').insert(storeData.epics));
      }

      if (storeData.tasks.length > 0) {
        console.log(`  - Importing ${storeData.tasks.length} tasks...`);
        operations.push(client.from('tasks').insert(storeData.tasks));
      }

      const results = await Promise.all(operations);

      // Check for errors
      for (const result of results) {
        if (result.error) {
          console.error('Import error:', result.error);
          throw result.error;
        }
      }

      console.log('\n✅ Data import successful!');
    } else {
      console.log('ℹ️  No data to import\n');
    }

    console.log('\n🎉 Migration complete!');
    console.log('\nYour Flux data is now using the proper relational schema:');
    console.log('  - projects table');
    console.log('  - epics table');
    console.log('  - tasks table');
    console.log('\nThis provides better scalability, indexing, and query performance.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
