import type { Task } from '@flux/shared';
import { isTaskBlocked, isTaskBlocker } from '@flux/shared/client';

/**
 * A task as list views return it: comments replaced by a count so listing a
 * busy project stays small, plus its blocked/blocker flags. get_task returns
 * the full comment history.
 */
export async function taskSummary(task: Task) {
  const { comments, ...rest } = task;
  return {
    ...rest,
    comment_count: comments?.length ?? 0,
    ...(await listedFlags(task)),
  };
}

/**
 * The server's task list already carries blocked/blocker, so reuse them in
 * remote mode instead of two extra HTTP lookups per task; local storage and
 * the ready list arrive without them and are looked up.
 */
async function listedFlags(task: Task) {
  const listed = task as Task & { blocked?: unknown; blocker?: unknown };
  if (typeof listed.blocked === 'boolean' && typeof listed.blocker === 'boolean') {
    return { blocked: listed.blocked, blocker: listed.blocker };
  }
  return taskFlags(task.id);
}

/** Whether a task is blocked (waits on another) and is a blocker (others wait on it). */
export async function taskFlags(taskId: string) {
  const [blocked, blocker] = await Promise.all([isTaskBlocked(taskId), isTaskBlocker(taskId)]);
  return { blocked, blocker };
}
