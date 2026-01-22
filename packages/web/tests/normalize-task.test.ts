import { describe, it, expect } from 'vitest'
import { normalizeTaskWithBlocked, normalizeTasksWithBlocked } from '../src/utils/normalize'

describe('normalizeTaskWithBlocked', () => {
  it('converts null priority to undefined and defaults type to task', () => {
    const raw = {
      id: 't1',
      title: 'Sample',
      status: 'todo',
      depends_on: [],
      project_id: 'p1',
      priority: null, // should become undefined
      // type is missing -> default to 'task'
      blocked: true,
    }

    const n = normalizeTaskWithBlocked(raw)
    expect(n.priority).toBeUndefined()
    expect(n.type).toBe('task')
    expect(n.blocked).toBe(true)
  })

  it('preserves priority numbers and copies blocked flag', () => {
    const raw = {
      id: 't2',
      title: 'Do it',
      status: 'in_progress',
      depends_on: ['x'],
      project_id: 'p1',
      priority: 0,
      type: 'bug',
      blocked: false,
    }

    const n = normalizeTaskWithBlocked(raw)
    expect(n.priority).toBe(0)
    expect(n.type).toBe('bug')
    expect(n.blocked).toBe(false)
  })
})

describe('normalizeTasksWithBlocked', () => {
  it('handles non-array input safely', () => {
    // @ts-expect-error - intentionally wrong type
    const arr = normalizeTasksWithBlocked(null)
    expect(arr).toEqual([])
  })
})

