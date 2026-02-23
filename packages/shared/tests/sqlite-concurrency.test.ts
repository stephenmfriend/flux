import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createSqliteAdapter } from '../src/adapters/sqlite-adapter';
import { unlinkSync, existsSync } from 'fs';
import type { Task, Project } from '../src/types';

const TEST_DB = '/tmp/flux-concurrency-test.sqlite';

function cleanup() {
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB);
  }
  if (existsSync(`${TEST_DB}-shm`)) {
    unlinkSync(`${TEST_DB}-shm`);
  }
  if (existsSync(`${TEST_DB}-wal`)) {
    unlinkSync(`${TEST_DB}-wal`);
  }
}

beforeEach(cleanup);
afterEach(cleanup);

describe('SQLite Adapter Concurrency', () => {
  test('sequential writes from single adapter accumulate correctly', () => {
    const adapter = createSqliteAdapter(TEST_DB);
    adapter.read();
    adapter.data.projects = [{ id: 'test-project', name: 'Test' } as Project];
    adapter.data.tasks = [];
    adapter.write();

    // Add tasks one at a time, writing after each
    for (let i = 0; i < 10; i++) {
      adapter.data.tasks.push({
        id: `task-${i}`,
        title: `Task ${i}`,
        status: 'todo',
        depends_on: [],
        comments: [],
        project_id: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Task);
      adapter.write();
    }

    // Verify from fresh adapter
    const verifyAdapter = createSqliteAdapter(TEST_DB);
    verifyAdapter.read();
    expect(verifyAdapter.data.tasks.length).toBe(10);
  });

  test('concurrent updates to same task should preserve latest changes', async () => {
    // Initialize with a task
    const initAdapter = createSqliteAdapter(TEST_DB);
    initAdapter.read();
    initAdapter.data.projects = [{ id: 'test-project', name: 'Test' }];
    initAdapter.data.tasks = [{
      id: 'task-1',
      title: 'Original',
      status: 'todo',
      depends_on: [],
      comments: [],
      project_id: 'test-project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }];
    initAdapter.write();

    // Two agents update the same task concurrently
    async function updateTask(newTitle: string) {
      const adapter = createSqliteAdapter(TEST_DB);
      adapter.read();

      await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

      const task = adapter.data.tasks.find(t => t.id === 'task-1');
      if (task) {
        task.title = newTitle;
        task.updated_at = new Date().toISOString();
      }

      adapter.write();
    }

    await Promise.all([
      updateTask('Updated by A'),
      updateTask('Updated by B'),
    ]);

    // Verify task still exists and has one of the updates
    const finalAdapter = createSqliteAdapter(TEST_DB);
    finalAdapter.read();

    expect(finalAdapter.data.tasks.length).toBe(1);
    const task = finalAdapter.data.tasks[0];
    expect(['Updated by A', 'Updated by B']).toContain(task.title);
  });

  test('single-writer: deletes persist without resurrection', () => {
    // Initialise with tasks
    const adapter = createSqliteAdapter(TEST_DB);
    adapter.read();
    adapter.data.projects = [{ id: 'test-project', name: 'Test' } as Project];
    adapter.data.tasks = [
      {
        id: 'task-to-delete',
        title: 'Delete Me',
        status: 'todo',
        depends_on: [],
        comments: [],
        project_id: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Task,
      {
        id: 'task-to-keep',
        title: 'Keep Me',
        status: 'todo',
        depends_on: [],
        comments: [],
        project_id: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Task,
    ];
    adapter.write();

    // Delete one task (single writer)
    adapter.data.tasks = adapter.data.tasks.filter(t => t.id !== 'task-to-delete');
    adapter.write();

    // Re-read from disk — deleted task should stay deleted
    const verifyAdapter = createSqliteAdapter(TEST_DB);
    verifyAdapter.read();

    expect(verifyAdapter.data.tasks.length).toBe(1);
    expect(verifyAdapter.data.tasks[0].id).toBe('task-to-keep');
  });
});
