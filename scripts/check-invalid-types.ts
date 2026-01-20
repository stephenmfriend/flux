#!/usr/bin/env bun
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.flux/.env.local', 'utf-8').split('\n').reduce((a, l) => {
  const [k, v] = l.split('=');
  if (k && v) a[k] = v;
  return a;
}, {} as Record<string, string>);

const c = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const { data } = await c.from('tasks').select('id,title,type');

const validTypes = ['task', 'bug', 'feature', 'refactor', 'docs', 'chore'];
const invalid = data?.filter(t => t.type === null || t.type === undefined || !validTypes.includes(t.type)) || [];

console.log('Invalid types found:', invalid.length);
if (invalid.length > 0) {
  console.log(JSON.stringify(invalid.slice(0, 10), null, 2));
}

// Also check for null/undefined
const nullTypes = data?.filter(t => t.type === null || t.type === undefined) || [];
console.log('Null/undefined types:', nullTypes.length);
