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
    ...(await taskFlags(task.id)),
  };
}

/** Whether a task is blocked (waits on another) and is a blocker (others wait on it). */
export async function taskFlags(taskId: string) {
  const [blocked, blocker] = await Promise.all([isTaskBlocked(taskId), isTaskBlocker(taskId)]);
  return { blocked, blocker };
}
