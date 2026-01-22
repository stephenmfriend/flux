import { parseTask, parseEpic, parseProject } from '../schemas'
import type { TaskWithBlocked } from '../stores'
import type { Epic, Project } from '@flux/shared'

// Normalize raw task objects from API into safe shapes for UI rendering
export function normalizeTaskWithBlocked(raw: unknown): TaskWithBlocked {
  // Parse and coerce fields (handles priority null -> undefined, type default)
  const parsed = parseTask(raw)
  const blocked = typeof (raw as any)?.blocked === 'boolean' ? (raw as any).blocked : false
  return { ...parsed, blocked }
}

export function normalizeTasksWithBlocked(raw: unknown): TaskWithBlocked[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeTaskWithBlocked)
}

// Epics
export function normalizeEpic(raw: unknown): Epic {
  return parseEpic(raw) as unknown as Epic
}

export function normalizeEpics(raw: unknown): Epic[] {
  if (!Array.isArray(raw)) return []
  return raw.map((e) => normalizeEpic(e))
}

// Projects (basic normalization; preserves extra fields if any)
export function normalizeProject(raw: unknown): Project {
  return parseProject(raw) as unknown as Project
}
