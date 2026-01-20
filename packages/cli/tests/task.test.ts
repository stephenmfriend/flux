import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { setupTestEnv, teardownTestEnv, getLogs, getErrors, MOCK_PRIORITY_CONFIG } from './helpers.js';

vi.mock('../src/client.js', () => ({
  getTasks: vi.fn(),
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  addTaskComment: vi.fn(),
  isTaskBlocked: vi.fn(),
  PRIORITY_CONFIG: MOCK_PRIORITY_CONFIG,
  PRIORITIES: [0, 1, 2],
}));

import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  isTaskBlocked,
} from '../src/client.js';
import { taskCommand } from '../src/commands/task.js';

const mockGetTasks = getTasks as Mock;
const mockGetTask = getTask as Mock;
const mockCreateTask = createTask as Mock;
const mockUpdateTask = updateTask as Mock;
const mockDeleteTask = deleteTask as Mock;
const mockAddTaskComment = addTaskComment as Mock;
const mockIsTaskBlocked = isTaskBlocked as Mock;

describe('task command', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    teardownTestEnv();
  });

  describe('list', () => {
    it('lists tasks for a project', async () => {
      mockGetTasks.mockResolvedValue([
        { id: 'task-1', title: 'First', status: 'todo', priority: 1 },
        { id: 'task-2', title: 'Second', status: 'done', priority: 0 },
      ]);
      mockIsTaskBlocked.mockResolvedValue(false);

      await taskCommand('list', ['proj-1'], {}, false);

      expect(mockGetTasks).toHaveBeenCalledWith('proj-1');
      expect(getLogs().some(l => l.includes('task-1') && l.includes('First'))).toBe(true);
      expect(getLogs().some(l => l.includes('task-2') && l.includes('Second'))).toBe(true);
    });

    it('shows blocked indicator', async () => {
      mockGetTasks.mockResolvedValue([
        { id: 'task-1', title: 'Blocked Task', status: 'todo', priority: 1 },
      ]);
      mockIsTaskBlocked.mockResolvedValue(true);

      await taskCommand('list', ['proj-1'], {}, false);

      expect(getLogs().some(l => l.includes('[BLOCKED]'))).toBe(true);
    });

    it('filters by epic', async () => {
      mockGetTasks.mockResolvedValue([
        { id: 'task-1', title: 'In Epic', status: 'todo', epic_id: 'epic-1' },
        { id: 'task-2', title: 'No Epic', status: 'todo' },
      ]);
      mockIsTaskBlocked.mockResolvedValue(false);

      await taskCommand('list', ['proj-1'], { epic: 'epic-1' }, false);

      expect(getLogs().some(l => l.includes('task-1'))).toBe(true);
      expect(getLogs().some(l => l.includes('task-2'))).toBe(false);
    });

    it('filters by status', async () => {
      mockGetTasks.mockResolvedValue([
        { id: 'task-1', title: 'Todo', status: 'todo' },
        { id: 'task-2', title: 'Done', status: 'done' },
      ]);
      mockIsTaskBlocked.mockResolvedValue(false);

      await taskCommand('list', ['proj-1'], { status: 'done' }, false);

      expect(getLogs().some(l => l.includes('task-2'))).toBe(true);
      expect(getLogs().some(l => l.includes('task-1'))).toBe(false);
    });

    it('shows message when no tasks', async () => {
      mockGetTasks.mockResolvedValue([]);

      await taskCommand('list', ['proj-1'], {}, false);

      expect(getLogs()).toContain('No tasks');
    });

    it('exits with error when no project provided', async () => {
      await expect(taskCommand('list', [], {}, false)).rejects.toThrow('process.exit(1)');
      expect(getErrors().some(e => e.includes('Usage:'))).toBe(true);
    });

    it('outputs JSON when --json flag', async () => {
      mockGetTasks.mockResolvedValue([{ id: 'task-1', title: 'Test', status: 'todo' }]);
      mockIsTaskBlocked.mockResolvedValue(false);

      await taskCommand('list', ['proj-1'], {}, true);

      const output = JSON.parse(getLogs()[0]);
      expect(output).toHaveLength(1);
      expect(output[0].blocked).toBe(false);
    });

    it('displays priority in task list with P0', async () => {
      mockGetTasks.mockResolvedValue([
        { id: 'task-1', title: 'Urgent', status: 'todo', priority: 0 },
      ]);
      mockIsTaskBlocked.mockResolvedValue(false);

      await taskCommand('list', ['proj-1'], {}, false);

      expect(getLogs().some(l => l.includes('P0'))).toBe(true);
      expect(getLogs().some(l => l.includes('Urgent'))).toBe(true);
    });

    it('displays priority in task list with P1', async () => {
      mockGetTasks.mockResolvedValue([
        { id: 'task-2', title: 'Normal', status: 'todo', priority: 1 },
      ]);
      mockIsTaskBlocked.mockResolvedValue(false);

      await taskCommand('list', ['proj-1'], {}, false);

      expect(getLogs().some(l => l.includes('P1'))).toBe(true);
      expect(getLogs().some(l => l.includes('Normal'))).toBe(true);
    });

    it('displays priority in task list with P2', async () => {
      mockGetTasks.mockResolvedValue([
        { id: 'task-3', title: 'Low', status: 'todo', priority: 2 },
      ]);
      mockIsTaskBlocked.mockResolvedValue(false);

      await taskCommand('list', ['proj-1'], {}, false);

      expect(getLogs().some(l => l.includes('P2'))).toBe(true);
      expect(getLogs().some(l => l.includes('Low'))).toBe(true);
    });

    it('displays default priority P2 when priority is undefined', async () => {
      mockGetTasks.mockResolvedValue([
        { id: 'task-4', title: 'No Priority', status: 'todo' },
      ]);
      mockIsTaskBlocked.mockResolvedValue(false);

      await taskCommand('list', ['proj-1'], {}, false);

      expect(getLogs().some(l => l.includes('P2'))).toBe(true);
      expect(getLogs().some(l => l.includes('No Priority'))).toBe(true);
    });

    it('displays multiple tasks with different priorities', async () => {
      mockGetTasks.mockResolvedValue([
        { id: 'task-1', title: 'High', status: 'todo', priority: 0 },
        { id: 'task-2', title: 'Medium', status: 'todo', priority: 1 },
        { id: 'task-3', title: 'Low', status: 'todo', priority: 2 },
      ]);
      mockIsTaskBlocked.mockResolvedValue(false);

      await taskCommand('list', ['proj-1'], {}, false);

      const logs = getLogs().join(' ');
      expect(logs.includes('P0')).toBe(true);
      expect(logs.includes('P1')).toBe(true);
      expect(logs.includes('P2')).toBe(true);
      expect(logs.includes('High')).toBe(true);
      expect(logs.includes('Medium')).toBe(true);
      expect(logs.includes('Low')).toBe(true);
    });
  });

  describe('create', () => {
    it('creates a task', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-new', title: 'New Task', status: 'todo' });

      await taskCommand('create', ['proj-1', 'New Task'], {}, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'New Task', undefined, { priority: undefined });
      expect(getLogs()).toContain('Created task: task-new');
    });

    it('creates task with priority', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-1', title: 'Urgent', status: 'todo', priority: 0 });

      await taskCommand('create', ['proj-1', 'Urgent'], { P: '0' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'Urgent', undefined, { priority: 0 });
    });

    it('creates task with -P 0 (P0 priority)', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-1', title: 'P0 Task', status: 'todo', priority: 0 });

      await taskCommand('create', ['proj-1', 'P0 Task'], { P: '0' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'P0 Task', undefined, { priority: 0 });
    });

    it('creates task with -P 1 (P1 priority)', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-2', title: 'P1 Task', status: 'todo', priority: 1 });

      await taskCommand('create', ['proj-1', 'P1 Task'], { P: '1' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'P1 Task', undefined, { priority: 1 });
    });

    it('creates task with -P 2 (P2 priority)', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-3', title: 'P2 Task', status: 'todo', priority: 2 });

      await taskCommand('create', ['proj-1', 'P2 Task'], { P: '2' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'P2 Task', undefined, { priority: 2 });
    });

    it('creates task with invalid -P value (defaults to undefined)', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-4', title: 'Invalid Priority', status: 'todo' });

      await taskCommand('create', ['proj-1', 'Invalid Priority'], { P: '5' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'Invalid Priority', undefined, { priority: undefined });
    });

    it('creates task with invalid -P value as string (defaults to undefined)', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-5', title: 'Invalid String Priority', status: 'todo' });

      await taskCommand('create', ['proj-1', 'Invalid String Priority'], { P: 'high' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'Invalid String Priority', undefined, { priority: undefined });
    });

    it('creates task with negative -P value (defaults to undefined)', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-6', title: 'Negative Priority', status: 'todo' });

      await taskCommand('create', ['proj-1', 'Negative Priority'], { P: '-1' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'Negative Priority', undefined, { priority: undefined });
    });

    it('creates task with --priority flag alias', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-7', title: 'Long Flag', status: 'todo', priority: 1 });

      await taskCommand('create', ['proj-1', 'Long Flag'], { priority: '1' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'Long Flag', undefined, { priority: 1 });
    });

    it('creates task with epic', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo', epic_id: 'epic-1' });

      await taskCommand('create', ['proj-1', 'Test'], { e: 'epic-1' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'Test', 'epic-1', { priority: undefined });
    });

    it('creates task with initial comment', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo' });
      mockAddTaskComment.mockResolvedValue({ id: 'c-1', body: 'Note', author: 'user' });

      await taskCommand('create', ['proj-1', 'Test'], { note: 'Initial note' }, false);

      expect(mockAddTaskComment).toHaveBeenCalledWith('task-1', 'Initial note', 'user');
    });

    it('creates task with dependencies', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-2', title: 'Dependent', status: 'todo', depends_on: ['task-1'] });

      await taskCommand('create', ['proj-1', 'Dependent'], { depends: 'task-1' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'Dependent', undefined, { priority: undefined, depends_on: ['task-1'] });
    });

    it('creates task with multiple dependencies using -d', async () => {
      mockCreateTask.mockResolvedValue({ id: 'task-3', title: 'Multi', status: 'todo', depends_on: ['task-1', 'task-2'] });

      await taskCommand('create', ['proj-1', 'Multi'], { d: 'task-1, task-2' }, false);

      expect(mockCreateTask).toHaveBeenCalledWith('proj-1', 'Multi', undefined, { priority: undefined, depends_on: ['task-1', 'task-2'] });
    });

    it('exits with error when missing args', async () => {
      await expect(taskCommand('create', ['proj-1'], {}, false)).rejects.toThrow('process.exit(1)');
      expect(getErrors().some(e => e.includes('Usage:'))).toBe(true);
    });
  });

  describe('update', () => {
    it('updates task title', async () => {
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Updated', status: 'todo' });

      await taskCommand('update', ['task-1'], { title: 'Updated' }, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { title: 'Updated' });
      expect(getLogs()).toContain('Updated task: task-1');
    });

    it('updates task status', async () => {
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'in_progress' });

      await taskCommand('update', ['task-1'], { status: 'in_progress' }, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { status: 'in_progress' });
    });

    it('adds comment only', async () => {
      mockAddTaskComment.mockResolvedValue({ id: 'c-1', body: 'Comment', author: 'user' });
      mockGetTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo' });

      await taskCommand('update', ['task-1'], { note: 'My comment' }, false);

      expect(mockAddTaskComment).toHaveBeenCalledWith('task-1', 'My comment', 'user');
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(getLogs()).toContain('Added comment to task: task-1');
    });

    it('exits with error when task not found', async () => {
      mockUpdateTask.mockResolvedValue(undefined);

      await expect(taskCommand('update', ['bad-id'], { title: 'Test' }, false)).rejects.toThrow('process.exit(1)');
      expect(getErrors()).toContain('Task not found: bad-id');
    });

    it('updates task dependencies', async () => {
      mockUpdateTask.mockResolvedValue({ id: 'task-2', title: 'Test', status: 'todo', depends_on: ['task-1'] });

      await taskCommand('update', ['task-2'], { depends: 'task-1' }, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-2', { depends_on: ['task-1'] });
    });

    it('exits with error when no id provided', async () => {
      await expect(taskCommand('update', [], {}, false)).rejects.toThrow('process.exit(1)');
    });

    it('updates task priority to P0', async () => {
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo', priority: 0 });

      await taskCommand('update', ['task-1'], { P: '0' }, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { priority: 0 });
    });

    it('updates task priority to P1', async () => {
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo', priority: 1 });

      await taskCommand('update', ['task-1'], { P: '1' }, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { priority: 1 });
    });

    it('updates task priority to P2', async () => {
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo', priority: 2 });

      await taskCommand('update', ['task-1'], { P: '2' }, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { priority: 2 });
    });

    it('updates task priority using --priority flag alias', async () => {
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo', priority: 1 });

      await taskCommand('update', ['task-1'], { priority: '1' }, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { priority: 1 });
    });

    it('updates task priority with invalid value (parses as NaN)', async () => {
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo', priority: NaN });

      await taskCommand('update', ['task-1'], { P: 'invalid' }, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { priority: NaN });
    });
  });

  describe('delete', () => {
    it('deletes a task', async () => {
      mockGetTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo' });
      mockDeleteTask.mockResolvedValue(true);

      await taskCommand('delete', ['task-1'], {}, false);

      expect(mockDeleteTask).toHaveBeenCalledWith('task-1');
      expect(getLogs()).toContain('Deleted task: task-1');
    });

    it('exits with error when task not found', async () => {
      mockGetTask.mockResolvedValue(undefined);

      await expect(taskCommand('delete', ['bad-id'], {}, false)).rejects.toThrow('process.exit(1)');
      expect(getErrors()).toContain('Task not found: bad-id');
    });
  });

  describe('done', () => {
    it('marks task as done', async () => {
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'done' });

      await taskCommand('done', ['task-1'], {}, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { status: 'done' });
      expect(getLogs()).toContain('Completed task: task-1');
    });

    it('adds comment before marking done', async () => {
      mockAddTaskComment.mockResolvedValue({ id: 'c-1', body: 'Done note', author: 'user' });
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'done' });

      await taskCommand('done', ['task-1'], { note: 'Done note' }, false);

      expect(mockAddTaskComment).toHaveBeenCalledWith('task-1', 'Done note', 'user');
      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { status: 'done' });
    });

    it('exits with error when task not found', async () => {
      mockUpdateTask.mockResolvedValue(undefined);

      await expect(taskCommand('done', ['bad-id'], {}, false)).rejects.toThrow('process.exit(1)');
    });
  });

  describe('start', () => {
    it('starts a task', async () => {
      mockGetTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'todo' });
      mockUpdateTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'in_progress' });

      await taskCommand('start', ['task-1'], {}, false);

      expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { status: 'in_progress' });
      expect(getLogs()).toContain('Started task: task-1');
    });

    it('rejects starting a planning task', async () => {
      mockGetTask.mockResolvedValue({ id: 'task-1', title: 'Test', status: 'planning' });

      await expect(taskCommand('start', ['task-1'], {}, false)).rejects.toThrow('process.exit(1)');
      expect(getErrors().some(e => e.includes('planning'))).toBe(true);
    });

    it('exits with error when task not found', async () => {
      mockGetTask.mockResolvedValue(undefined);

      await expect(taskCommand('start', ['bad-id'], {}, false)).rejects.toThrow('process.exit(1)');
      expect(getErrors()).toContain('Task not found: bad-id');
    });
  });

  describe('invalid subcommand', () => {
    it('exits with usage error', async () => {
      await expect(taskCommand('invalid', [], {}, false)).rejects.toThrow('process.exit(1)');
      expect(getErrors().some(e => e.includes('Usage:'))).toBe(true);
    });
  });
});
