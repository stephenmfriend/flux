import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { Tag } from './Tag'

describe('Tag', () => {
  it('renders children text', () => {
    render(<Tag color="purple">UX</Tag>)
    expect(screen.getByText('UX')).toBeInTheDocument()
  })

  it('applies color variant classes', () => {
    const colors = ['purple', 'blue', 'orange', 'green', 'red'] as const

    colors.forEach((color) => {
      const { container, unmount } = render(<Tag color={color}>{color}</Tag>)
      expect(container.firstChild).toHaveClass(`tag-${color}`)
      unmount()
    })
  })

  it('applies base tag class', () => {
    const { container } = render(<Tag color="purple">Tag</Tag>)
    expect(container.firstChild).toHaveClass('tag')
  })
})
