import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  deleteTaskComment,
  getReadyTasks,
} from '@flux/shared/client';
import type { Guardrail, Priority, Status } from '@flux/shared';
import { agentSchema, commentSchema, guardrailInputSchema, prioritySchema, statusSchema, taskSchema } from '../schemas.js';
import { taskFlags, taskSummary } from '../task-views.js';
import { errorResult, structuredResult, textResult } from './util.js';

const CANNOT_START_PLANNING =
  'Cannot start a task that is still in planning. Move the task to "todo" first.';

/** Workflow guard: tasks in 'planning' cannot go directly to 'in_progress'. */
async function violatesPlanningWorkflow(taskId: string, nextStatus?: string): Promise<boolean> {
  if (nextStatus !== 'in_progress') return false;
  const current = await getTask(taskId);
  return current?.status === 'planning';
}

/** Agent team worker tracking for status changes. */
async function workerUpdates(
  taskId: string,
  nextStatus?: string,
  agentName?: string
): Promise<{ workers?: string[] }> {
  if (nextStatus === 'in_progress' && agentName) {
    const current = await getTask(taskId);
    const workers = current?.workers || [];
    if (!workers.includes(agentName)) {
      return { workers: [...workers, agentName] };
    }
    return {};
  }
  if (nextStatus === 'done') {
    return { workers: [] };
  }
  return {};
}

export function registerTaskTools(server: McpServer): void {
  server.registerTool(
    'list_tasks',
    {
      title: 'List Tasks',
      description:
        'List all tasks in a project with their blocked/blocker status. Comments are replaced by comment_count; use get_task for full detail.',
      inputSchema: {
        project_id: z.string().describe('Project ID'),
        epic_id: z.string().optional().describe('Optional: filter by epic ID'),
        status: statusSchema.optional().describe('Optional: filter by status'),
        priority: prioritySchema.optional().describe('Optional: filter by priority (0=urgent, 1=normal, 2=low)'),
      },
      outputSchema: { tasks: z.array(taskSchema) },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ project_id, epic_id, status, priority }) => {
      let taskList = await getTasks(project_id);
      if (epic_id) taskList = taskList.filter((t) => t.epic_id === epic_id);
      if (status) taskList = taskList.filter((t) => t.status === status);
      if (priority !== undefined) taskList = taskList.filter((t) => t.priority === priority);
      const tasks = await Promise.all(taskList.map(taskSummary));
      return structuredResult({ tasks });
    }
  );

  server.registerTool(
    'get_task',
    {
      title: 'Get Task',
      description: 'Get a single task with full details including comments',
      inputSchema: {
        task_id: z.string().describe('Task ID'),
      },
      outputSchema: { task: taskSchema },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ task_id }) => {
      const task = await getTask(task_id);
      if (!task) return errorResult('Task not found');
      return structuredResult({ task: { ...task, ...(await taskFlags(task.id)) } });
    }
  );

  server.registerTool(
    'list_ready_tasks',
    {
      title: 'List Ready Tasks',
      description:
        'List tasks that are ready to work on (not done, not blocked, sorted by priority). Use this to find actionable work.',
      inputSchema: {
        project_id: z.string().optional().describe('Optional: filter by project ID'),
      },
      outputSchema: { tasks: z.array(taskSchema) },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ project_id }) => {
      const tasks = await Promise.all((await getReadyTasks(project_id)).map(taskSummary));
      return structuredResult({ tasks });
    }
  );

  server.registerTool(
    'create_task',
    {
      title: 'Create Task',
      description: 'Create a new task in a project. Use add_task_comment to add notes.',
      inputSchema: {
        project_id: z.string().describe('Project ID'),
        title: z.string().describe('Task title'),
        epic_id: z.string().optional().describe('Optional: assign to epic'),
        priority: prioritySchema.optional().describe('Priority: 0 = urgent (P0), 1 = normal (P1), 2 = low (P2)'),
        agent: agentSchema.optional().describe('Agent assignment (claude, codex, gemini, other)'),
        depends_on: z.array(z.string()).optional().describe('IDs of tasks this task depends on'),
        description: z
          .string()
          .optional()
          .describe('Detailed description: context, background, approach notes (markdown/plain text)'),
        acceptance_criteria: z
          .array(z.string())
          .optional()
          .describe('Observable behavioral outcomes for verification (e.g., "Processes <5MB in <100ms")'),
        guardrails: z
          .array(guardrailInputSchema)
          .optional()
          .describe('Numbered behavioral constraints (higher number = more critical)'),
      },
      outputSchema: { task: taskSchema },
      annotations: { openWorldHint: false },
    },
    async ({ project_id, title, epic_id, priority, agent, depends_on, description, acceptance_criteria, guardrails }) => {
      let task = await createTask(project_id, title, epic_id, {
        priority: priority as Priority | undefined,
        depends_on,
        description,
        acceptance_criteria,
        guardrails: guardrails as Guardrail[] | undefined, // IDs generated by store if missing
      });
      // createTask has no agent option, so assign it with a follow-up update
      if (agent) task = (await updateTask(task.id, { agent })) ?? task;
      return structuredResult({ task }, `Created task "${task.title}" with ID: ${task.id}`);
    }
  );

  server.registerTool(
    'update_task',
    {
      title: 'Update Task',
      description:
        'Update an existing task (change status, title, description, epic, or dependencies). Use add_task_comment for notes. Tasks must be moved to "todo" before they can be started (moved to "in_progress").',
      inputSchema: {
        task_id: z.string().describe('Task ID'),
        title: z.string().optional().describe('New task title'),
        status: statusSchema
          .optional()
          .describe(
            'New task status (planning, todo, in_progress, done). Tasks in "planning" cannot be moved directly to "in_progress".'
          ),
        epic_id: z.string().optional().describe('Assign to epic (or empty to unassign)'),
        priority: prioritySchema.optional().describe('Priority: 0 = urgent (P0), 1 = normal (P1), 2 = low (P2)'),
        agent: agentSchema
          .or(z.literal(''))
          .optional()
          .describe('Agent assignment (claude, codex, gemini, other); empty string clears'),
        depends_on: z.array(z.string()).optional().describe('IDs of tasks this task depends on'),
        blocked_reason: z
          .string()
          .nullable()
          .optional()
          .describe(
            'External blocker reason (e.g., "Waiting for vendor quote"). Set to null or empty string to clear.'
          ),
        description: z
          .string()
          .nullable()
          .optional()
          .describe('Detailed description (context, background, approach). Set to null or empty string to clear.'),
        acceptance_criteria: z
          .array(z.string())
          .optional()
          .describe('Observable behavioral outcomes for verification (e.g., "Processes <5MB in <100ms")'),
        guardrails: z
          .array(guardrailInputSchema)
          .optional()
          .describe('Numbered behavioral constraints (higher number = more critical)'),
        agent_name: z
          .string()
          .optional()
          .describe(
            'Name of the agent/teammate performing this update (for agent team tracking on the Kanban board)'
          ),
      },
      outputSchema: { task: taskSchema },
      annotations: { idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      if (await violatesPlanningWorkflow(args.task_id, args.status)) {
        return errorResult(CANNOT_START_PLANNING);
      }
      const updates: Record<string, unknown> = {};
      if (args.title) updates.title = args.title;
      if (args.status) updates.status = args.status;
      if (args.epic_id !== undefined) updates.epic_id = args.epic_id || undefined;
      if (args.priority !== undefined) updates.priority = args.priority;
      if (args.agent !== undefined) updates.agent = args.agent || undefined;
      if (args.depends_on) updates.depends_on = args.depends_on;
      if (args.blocked_reason !== undefined) {
        updates.blocked_reason = args.blocked_reason ?? ''; // Empty string/null clears
      }
      if (args.description !== undefined) updates.description = args.description ?? '';
      if (args.acceptance_criteria !== undefined) updates.acceptance_criteria = args.acceptance_criteria;
      if (args.guardrails !== undefined) updates.guardrails = args.guardrails;
      Object.assign(updates, await workerUpdates(args.task_id, args.status, args.agent_name));
      const task = await updateTask(args.task_id, updates);
      if (!task) return errorResult('Task not found');
      const result = { ...task, ...(await taskFlags(task.id)) };
      return structuredResult({ task: result }, `Updated task: ${JSON.stringify(result, null, 2)}`);
    }
  );

  server.registerTool(
    'delete_task',
    {
      title: 'Delete Task',
      description: 'Delete a task',
      inputSchema: {
        task_id: z.string().describe('Task ID to delete'),
      },
      annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ task_id }) => {
      const success = await deleteTask(task_id);
      if (!success) return errorResult('Task not found');
      return textResult(`Deleted task ${task_id}`);
    }
  );

  server.registerTool(
    'move_task_status',
    {
      title: 'Move Task Status',
      description:
        'Quickly move a task to a new status. Note: tasks must be in "todo" before they can be started (moved to "in_progress").',
      inputSchema: {
        task_id: z.string().describe('Task ID'),
        status: statusSchema.describe(
          'New status (planning, todo, in_progress, done). Tasks in "planning" cannot be moved directly to "in_progress".'
        ),
        agent_name: z
          .string()
          .optional()
          .describe(
            'Name of the agent/teammate performing this update (for agent team tracking on the Kanban board)'
          ),
      },
      outputSchema: { task: taskSchema },
      annotations: { idempotentHint: true, openWorldHint: false },
    },
    async ({ task_id, status, agent_name }) => {
      if (await violatesPlanningWorkflow(task_id, status)) {
        return errorResult(CANNOT_START_PLANNING);
      }
      const updates: Record<string, unknown> = { status: status as Status };
      Object.assign(updates, await workerUpdates(task_id, status, agent_name));
      const task = await updateTask(task_id, updates);
      if (!task) return errorResult('Task not found');
      return structuredResult({ task }, `Moved task "${task.title}" to ${status}`);
    }
  );

  server.registerTool(
    'add_task_comment',
    {
      title: 'Add Task Comment',
      description: 'Add a comment to a task',
      inputSchema: {
        task_id: z.string().describe('Task ID'),
        body: z.string().describe('Comment body'),
        author: z.enum(['user', 'mcp']).optional().describe('Comment author type (defaults to mcp)'),
        agent_name: z
          .string()
          .optional()
          .describe('Name of the agent/teammate adding this comment (shown as badge on the Kanban board)'),
      },
      outputSchema: { comment: commentSchema },
      annotations: { openWorldHint: false },
    },
    async ({ task_id, body, author, agent_name }) => {
      const trimmed = body?.trim();
      if (!trimmed) return errorResult('Comment body required');
      const comment = await addTaskComment(task_id, trimmed, author === 'user' ? 'user' : 'mcp', agent_name);
      if (!comment) return errorResult('Task not found');
      return structuredResult({ comment }, `Added comment ${comment.id}`);
    }
  );

  server.registerTool(
    'delete_task_comment',
    {
      title: 'Delete Task Comment',
      description: 'Delete a comment from a task',
      inputSchema: {
        task_id: z.string().describe('Task ID'),
        comment_id: z.string().describe('Comment ID'),
      },
      annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ task_id, comment_id }) => {
      const success = await deleteTaskComment(task_id, comment_id);
      if (!success) return errorResult('Comment not found');
      return textResult(`Deleted comment ${comment_id}`);
    }
  );
}
