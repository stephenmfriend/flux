#!/usr/bin/env bun
/**
 * Fix existing tasks in Supabase that don't have a type field.
 * Sets type to 'task' for any tasks missing the field.
 */

import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'node:path';
import { readFileSync } from 'node:fs';

// Load environment variables from .flux/.env.local
const fluxDir = resolve(process.cwd(), '.flux');
const envPath = resolve(fluxDir, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');

const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...valueParts] = trimmed.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
}

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .flux/.env.local');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 Checking for tasks without type field...\n');

// Fetch all tasks
const { data: tasks, error: fetchError } = await client
  .from('tasks')
  .select('*');

if (fetchError) {
  console.error('❌ Failed to fetch tasks:', fetchError);
  process.exit(1);
}

if (!tasks || tasks.length === 0) {
  console.log('✅ No tasks found in database.');
  process.exit(0);
}

console.log(`📊 Found ${tasks.length} total tasks`);

// Find tasks without type field
const tasksNeedingFix = tasks.filter(task => !task.type);

if (tasksNeedingFix.length === 0) {
  console.log('✅ All tasks already have a type field!');
  process.exit(0);
}

console.log(`🔧 Found ${tasksNeedingFix.length} tasks without type field`);
console.log('   Setting type to "task" for these tasks...\n');

// Update each task to have type: 'task'
for (const task of tasksNeedingFix) {
  const { error: updateError } = await client
    .from('tasks')
    .update({ type: 'task' })
    .eq('id', task.id);

  if (updateError) {
    console.error(`❌ Failed to update task ${task.id}:`, updateError);
  } else {
    console.log(`✅ Updated task: ${task.title.substring(0, 60)}${task.title.length > 60 ? '...' : ''}`);
  }
}

console.log(`\n✅ Successfully updated ${tasksNeedingFix.length} tasks!`);
