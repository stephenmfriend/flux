import { describe, it, expect, beforeEach } from 'bun:test';
import { setStorageAdapter, initStore, createProject, createTask, updateTask, deleteTask, getTasks } from '../src/store.js';
import { createTestAdapter } from './test-helpers.js';
import { createSqliteAdapter } from '../src/adapters/sqlite-adapter.js';
import type { Task } from '../src/types.js';

describe('Concurrent Write Operations', () => {
  describe('JSON Adapter', () => {
    beforeEach(() => {
      const adapter = createTestAdapter();
      setStorageAdapter(adapter);
      initStore();
    });

    it('handles concurrent task creation (10 parallel)', async () => {
      const project = await createProject('Test Project');

      // Create 10 tasks concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        createTask(project.id, `Task ${i}`)
      );

      const tasks = await Promise.all(promises);

      // Verify all tasks were created
      expect(tasks).toHaveLength(10);
      expect(new Set(tasks.map(t => t.id)).size).toBe(10); // All unique IDs

      // Verify all tasks are in storage
      const storedTasks = getTasks(project.id);
      expect(storedTasks).toHaveLength(10);
    });

    it('handles concurrent updates to different tasks', async () => {
      const project = await createProject('Test Project');
      const task1 = await createTask(project.id, 'Task 1');
      const task2 = await createTask(project.id, 'Task 2');
      const task3 = await createTask(project.id, 'Task 3');

      // Update all tasks concurrently
      const [updated1, updated2, updated3] = await Promise.all([
        updateTask(task1.id, { title: 'Updated 1' }),
        updateTask(task2.id, { title: 'Updated 2' }),
        updateTask(task3.id, { title: 'Updated 3' }),
      ]);

      expect(updated1?.title).toBe('Updated 1');
      expect(updated2?.title).toBe('Updated 2');
      expect(updated3?.title).toBe('Updated 3');
    });

    it('handles mixed operations in parallel', async () => {
      const project = await createProject('Test Project');
      const existingTask = await createTask(project.id, 'Existing');

      // Mix of create, update, delete operations
      const results = await Promise.all([
        createTask(project.id, 'New 1'),
        createTask(project.id, 'New 2'),
        updateTask(existingTask.id, { title: 'Modified' }),
        createTask(project.id, 'New 3'),
      ]);

      const tasks = getTasks(project.id);
      expect(tasks).toHaveLength(4); // 1 existing + 3 new
      expect(tasks.find(t => t.id === existingTask.id)?.title).toBe('Modified');
    });

    it('handles concurrent updates to same task (last write wins)', async () => {
      const project = await createProject('Test Project');
      const task = await createTask(project.id, 'Original');

      // Update same task concurrently with different values
      const updates = await Promise.all([
        updateTask(task.id, { title: 'Update A', status: 'todo' }),
        updateTask(task.id, { title: 'Update B', status: 'in_progress' }),
        updateTask(task.id, { title: 'Update C', status: 'done' }),
      ]);

      // All updates should succeed (last write wins)
      expect(updates.every(u => u !== undefined)).toBe(true);

      // Final state should be one of the updates
      const finalTask = getTasks(project.id).find(t => t.id === task.id);
      expect(['Update A', 'Update B', 'Update C']).toContain(finalTask?.title);
    });
  });

  describe('SQLite Adapter', () => {
    let adapter: ReturnType<typeof createSqliteAdapter>;

    beforeEach(() => {
      adapter = createSqliteAdapter(':memory:', true);
      setStorageAdapter(adapter);
      initStore();
    });

    it('handles concurrent task creation with transactions (10 parallel)', async () => {
      const project = await createProject('Test Project');

      // Create 10 tasks concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        createTask(project.id, `Task ${i}`)
      );

      const tasks = await Promise.all(promises);

      // Verify all tasks were created
      expect(tasks).toHaveLength(10);
      expect(new Set(tasks.map(t => t.id)).size).toBe(10);

      // Verify all tasks are in storage
      const storedTasks = getTasks(project.id);
      expect(storedTasks).toHaveLength(10);
    });

    it('handles concurrent updates with transaction isolation', async () => {
      const project = await createProject('Test Project');
      const task1 = await createTask(project.id, 'Task 1');
      const task2 = await createTask(project.id, 'Task 2');

      // Update tasks concurrently
      const [updated1, updated2] = await Promise.all([
        updateTask(task1.id, { title: 'Updated 1', status: 'todo' }),
        updateTask(task2.id, { title: 'Updated 2', status: 'in_progress' }),
      ]);

      expect(updated1?.title).toBe('Updated 1');
      expect(updated2?.title).toBe('Updated 2');
      expect(updated1?.status).toBe('todo');
      expect(updated2?.status).toBe('in_progress');
    });

    it('handles mixed operations without data loss', async () => {
      const project = await createProject('Test Project');
      const task1 = await createTask(project.id, 'Task 1');
      const task2 = await createTask(project.id, 'Task 2');

      // Mix operations
      await Promise.all([
        createTask(project.id, 'New Task'),
        updateTask(task1.id, { title: 'Modified 1' }),
        deleteTask(task2.id),
        createTask(project.id, 'Another New'),
      ]);

      const tasks = getTasks(project.id);
      expect(tasks).toHaveLength(3); // task1 (modified) + 2 new
      expect(tasks.find(t => t.id === task1.id)?.title).toBe('Modified 1');
      expect(tasks.find(t => t.id === task2.id)).toBeUndefined();
    });

    it('stress test: 50 concurrent task creations', async () => {
      const project = await createProject('Stress Test Project');

      const promises = Array.from({ length: 50 }, (_, i) =>
        createTask(project.id, `Stress Task ${i}`, undefined, { priority: i % 3 as 0 | 1 | 2 })
      );

      const tasks = await Promise.all(promises);

      expect(tasks).toHaveLength(50);
      expect(new Set(tasks.map(t => t.id)).size).toBe(50);

      const storedTasks = getTasks(project.id);
      expect(storedTasks).toHaveLength(50);
    });
  });

  describe('Stress Test - Multiple Runs', () => {
    it('consistently handles 10 concurrent creates across 10 runs', async () => {
      for (let run = 0; run < 10; run++) {
        const adapter = createTestAdapter();
        setStorageAdapter(adapter);
        initStore();

        const project = await createProject(`Run ${run}`);

        const promises = Array.from({ length: 10 }, (_, i) =>
          createTask(project.id, `Task ${i}`)
        );

        const tasks = await Promise.all(promises);
        const storedTasks = getTasks(project.id);

        expect(tasks).toHaveLength(10);
        expect(storedTasks).toHaveLength(10);
        expect(new Set(tasks.map(t => t.id)).size).toBe(10);
      }
    });
  });
});
