import { describe, it, expect } from 'vitest'
import { normalizeEpic, normalizeEpics, normalizeProject } from '../src/utils/normalize'

describe('normalizeEpic', () => {
  it('parses valid epic and drops extraneous fields', () => {
    const raw = {
      id: 'e1',
      title: 'An epic',
      status: 'planning',
      depends_on: [],
      notes: '',
      auto: false,
      project_id: 'p1',
      extra: 'ignored',
    }
    const e = normalizeEpic(raw)
    expect(e).toMatchObject({ id: 'e1', title: 'An epic', auto: false })
    // @ts-expect-error extra should not exist after parsing
    expect((e as any).extra).toBeUndefined()
  })

  it('array helper handles non-array input', () => {
    // @ts-expect-error
    const arr = normalizeEpics(null)
    expect(arr).toEqual([])
  })
})

describe('normalizeProject', () => {
  it('parses minimal project', () => {
    const raw = { id: 'p1', name: 'Proj' }
    const p = normalizeProject(raw)
    expect(p).toEqual({ id: 'p1', name: 'Proj' })
  })
})

