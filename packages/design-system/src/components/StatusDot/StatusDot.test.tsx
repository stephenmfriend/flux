import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { StatusDot } from './StatusDot'

describe('StatusDot', () => {
  it('renders with planning status', () => {
    const { container } = render(<StatusDot status="planning" />)
    expect(container.firstChild).toHaveClass('dot-planning')
  })

  it('renders with todo status', () => {
    const { container } = render(<StatusDot status="todo" />)
    expect(container.firstChild).toHaveClass('dot-todo')
  })

  it('renders with in_progress status', () => {
    const { container } = render(<StatusDot status="in_progress" />)
    expect(container.firstChild).toHaveClass('dot-progress')
  })

  it('renders with done status', () => {
    const { container } = render(<StatusDot status="done" />)
    expect(container.firstChild).toHaveClass('dot-done')
  })

  it('always has base dot class', () => {
    const { container } = render(<StatusDot status="planning" />)
    expect(container.firstChild).toHaveClass('dot')
  })
})
