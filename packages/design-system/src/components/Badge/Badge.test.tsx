import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge variant="green">Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies green variant class', () => {
    const { container } = render(<Badge variant="green">Green</Badge>)
    expect(container.firstChild).toHaveClass('badge-green')
  })

  it('applies gray variant class', () => {
    const { container } = render(<Badge variant="gray">Gray</Badge>)
    expect(container.firstChild).toHaveClass('badge-gray')
  })

  it('applies base badge class', () => {
    const { container } = render(<Badge variant="green">Badge</Badge>)
    expect(container.firstChild).toHaveClass('badge')
  })

  it('renders with custom className', () => {
    const { container } = render(<Badge variant="green" className="custom">Text</Badge>)
    expect(container.firstChild).toHaveClass('custom')
  })
})
