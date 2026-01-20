#!/usr/bin/env bun
/**
 * Import data.json into Supabase relational schema
 * Usage: bun scripts/import-to-relational.ts
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

  console.log('🔍 Loading data.json...\n');
  const dataPath = resolve(fluxDir, 'data.json');
  let storeData: Store;

  try {
    const content = readFileSync(dataPath, 'utf-8');
    storeData = JSON.parse(content);
    console.log(`✓ Loaded data.json with:`);
    console.log(`  - ${storeData.projects.length} projects`);
    console.log(`  - ${storeData.epics.length} epics`);
    console.log(`  - ${storeData.tasks.length} tasks\n`);
  } catch (error) {
    console.error(`Error reading ${dataPath}:`, error);
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

    console.log('🚀 Connecting to Supabase...\n');

    // Check if new tables exist
    const { error: projectsCheckError } = await client.from('projects').select('id').limit(1);

    if (projectsCheckError) {
      console.log('❌ New relational tables not found!\n');
      console.log('You need to run the migration SQL first:');
      console.log('1. Go to your Supabase dashboard → SQL Editor');
      console.log('2. Run the SQL from: packages/shared/migrations/supabase/002_relational_schema.sql\n');
      process.exit(1);
    }

    console.log('✓ Connected to Supabase\n');

    // Check for existing data
    console.log('🔍 Checking existing data...\n');
    const [existingProjects, existingEpics, existingTasks] = await Promise.all([
      client.from('projects').select('id'),
      client.from('epics').select('id'),
      client.from('tasks').select('id'),
    ]);

    const hasData =
      (existingProjects.data && existingProjects.data.length > 0) ||
      (existingEpics.data && existingEpics.data.length > 0) ||
      (existingTasks.data && existingTasks.data.length > 0);

    if (hasData) {
      console.log('⚠️  Database already contains data:');
      console.log(`  - ${existingProjects.data?.length || 0} projects`);
      console.log(`  - ${existingEpics.data?.length || 0} epics`);
      console.log(`  - ${existingTasks.data?.length || 0} tasks\n`);
      console.log('❌ Aborting to prevent data loss.\n');
      process.exit(1);
    }

    console.log('✓ Database is empty\n');

    // Import data into new tables (must be sequential due to foreign keys)
    console.log('📝 Importing data into relational tables...\n');

    // Import projects first
    if (storeData.projects.length > 0) {
      console.log(`  - Importing ${storeData.projects.length} projects...`);
      const { error: projectsError } = await client.from('projects').insert(storeData.projects);
      if (projectsError) {
        console.error('Projects import error:', projectsError);
        throw projectsError;
      }
    }

    // Then epics (depends on projects)
    if (storeData.epics.length > 0) {
      console.log(`  - Importing ${storeData.epics.length} epics...`);
      const { error: epicsError } = await client.from('epics').insert(storeData.epics);
      if (epicsError) {
        console.error('Epics import error:', epicsError);
        throw epicsError;
      }
    }

    // Then tasks (depends on projects and epics)
    if (storeData.tasks.length > 0) {
      console.log(`  - Importing ${storeData.tasks.length} tasks...`);
      const { error: tasksError } = await client.from('tasks').insert(storeData.tasks);
      if (tasksError) {
        console.error('Tasks import error:', tasksError);
        throw tasksError;
      }
    }

    console.log('\n✅ Data import successful!');
    console.log('\nImported:');
    console.log(`  - ${storeData.projects.length} projects`);
    console.log(`  - ${storeData.epics.length} epics`);
    console.log(`  - ${storeData.tasks.length} tasks\n`);

    console.log('Your Flux data is now using proper relational schema!');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();
