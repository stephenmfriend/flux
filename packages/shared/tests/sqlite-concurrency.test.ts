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
  test('concurrent writes from separate adapter instances should not lose data', async () => {
    // Initialize database
    const initAdapter = createSqliteAdapter(TEST_DB);
    initAdapter.read();
    initAdapter.data.projects = [{ id: 'test-project', name: 'Test' }];
    initAdapter.data.tasks = [];
    initAdapter.write();

    // Simulate concurrent writes from separate processes (like docker exec)
    async function writeTask(agentId: string, taskNum: number) {
      // Each call creates a NEW adapter instance (simulates separate process)
      const adapter = createSqliteAdapter(TEST_DB);
      adapter.read();

      // Simulate some processing delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

      const task: Task = {
        id: `${agentId}-task-${taskNum}`,
        title: `Task ${taskNum} from ${agentId}`,
        status: 'todo',
        depends_on: [],
        comments: [],
        project_id: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      adapter.data.tasks.push(task);
      adapter.write();
    }

    // Run 30 concurrent writes (3 agents × 10 tasks each)
    const writes = [];
    for (let i = 0; i < 10; i++) {
      writes.push(
        writeTask('agent-A', i),
        writeTask('agent-B', i),
        writeTask('agent-C', i)
      );
    }

    await Promise.all(writes);

    // Verify all tasks were saved
    const finalAdapter = createSqliteAdapter(TEST_DB);
    finalAdapter.read();

    expect(finalAdapter.data.tasks.length).toBe(30);

    // Verify each agent's tasks
    const agentATasks = finalAdapter.data.tasks.filter(t => t.id.startsWith('agent-A'));
    const agentBTasks = finalAdapter.data.tasks.filter(t => t.id.startsWith('agent-B'));
    const agentCTasks = finalAdapter.data.tasks.filter(t => t.id.startsWith('agent-C'));

    expect(agentATasks.length).toBe(10);
    expect(agentBTasks.length).toBe(10);
    expect(agentCTasks.length).toBe(10);
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

  test('mixed operations (create + update + delete) should not lose data', async () => {
    // Initialize with some tasks
    const initAdapter = createSqliteAdapter(TEST_DB);
    initAdapter.read();
    initAdapter.data.projects = [{ id: 'test-project', name: 'Test' }];
    initAdapter.data.tasks = [
      {
        id: 'existing-1',
        title: 'Existing Task 1',
        status: 'todo',
        depends_on: [],
        comments: [],
        project_id: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'existing-2',
        title: 'Existing Task 2',
        status: 'todo',
        depends_on: [],
        comments: [],
        project_id: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    initAdapter.write();

    // Agent A: Creates new tasks
    async function createTasks() {
      const adapter = createSqliteAdapter(TEST_DB);
      adapter.read();

      for (let i = 0; i < 5; i++) {
        adapter.data.tasks.push({
          id: `new-${i}`,
          title: `New Task ${i}`,
          status: 'todo',
          depends_on: [],
          comments: [],
          project_id: 'test-project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      adapter.write();
    }

    // Agent B: Updates existing task
    async function updateTask() {
      const adapter = createSqliteAdapter(TEST_DB);
      adapter.read();

      const task = adapter.data.tasks.find(t => t.id === 'existing-1');
      if (task) {
        task.status = 'in_progress';
      }

      adapter.write();
    }

    // Agent C: Deletes a task
    async function deleteTask() {
      const adapter = createSqliteAdapter(TEST_DB);
      adapter.read();

      adapter.data.tasks = adapter.data.tasks.filter(t => t.id !== 'existing-2');

      adapter.write();
    }

    await Promise.all([createTasks(), updateTask(), deleteTask()]);

    // Verify final state
    const finalAdapter = createSqliteAdapter(TEST_DB);
    finalAdapter.read();

    // Should have: 1 existing (existing-1) + 5 new = 6 tasks
    // existing-2 should be deleted
    expect(finalAdapter.data.tasks.length).toBeGreaterThanOrEqual(6);

    const existing1 = finalAdapter.data.tasks.find(t => t.id === 'existing-1');
    expect(existing1).toBeDefined();

    const newTasks = finalAdapter.data.tasks.filter(t => t.id.startsWith('new-'));
    expect(newTasks.length).toBe(5);
  });
});
